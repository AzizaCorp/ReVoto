"""Pruebas de reglas de negocio sobre un parquet sintético pequeño (no usan datos reales)."""

from __future__ import annotations

from pathlib import Path

import duckdb
import pytest

from revoto_pipeline.ejecutar import ejecutar_pasos, validar_oficiales

SQL = Path(__file__).resolve().parent.parent / "revoto_pipeline" / "sql"
COLUMNAS = "AELEC, EDOCVE, MPIOCVE, SECCION, SEXO, EDAD, LN, SV, NV, NS, source_file"

# (año, entidad, municipio, sección, sexo, edad, LN, SV, NV, NS)
FILAS = [
    (2024, 14, 39, 1, "H", 20, 100, 50, 40, 10),
    (2024, 14, 39, 1, "M", 30, 100, 70, 20, 10),
    (2024, 14, 39, 2, "X", 40, 100, 60, 40, 0),   # RN-06: sexo fuera de catálogo
    (2024, 14, 39, 2, "H", 140, 100, 99, 1, 0),   # RN-09: edad fuera de rango
    (2024, 14, 117, 3, "M", 50, 10, 5, 5, 0),     # municipio pequeño (RN-05)
]


@pytest.fixture()
def con(tmp_path: Path) -> duckdb.DuckDBPyConnection:
    c = duckdb.connect()
    valores = ", ".join(
        "(" + ", ".join(f"'{v}'" for v in fila) + ", 'sintetico.csv')" for fila in FILAS
    )
    parquet = (tmp_path / "staging.parquet").as_posix()
    c.execute(f"COPY (SELECT * FROM (VALUES {valores}) t({COLUMNAS})) TO '{parquet}' (FORMAT parquet)")
    ejecutar_pasos(c, SQL, {"ruta_staging": parquet, "umbral_rn05": 50})
    return c


def cifra(con, **filtro) -> float | None:
    condiciones = " AND ".join(
        f"{k} IS NULL" if v is None else f"{k} = '{v}'" for k, v in filtro.items()
    )
    fila = con.execute(f"SELECT participacion FROM mart_participacion WHERE {condiciones}").fetchone()
    return None if fila is None else fila[0]


def test_rn01_participacion_ajustada_excluye_sin_dato(con):
    # Válidos para el total: filas 1, 2, 3 y 5 → SV 185 / (LN 310 − NS 20)
    valor = cifra(con, nivel="nacional", grupo_edad=None, sexo=None)
    assert valor == pytest.approx(185 / 290)


def test_rn09_edad_fuera_de_rango_no_cuenta(con):
    (excluidos,) = con.execute(
        "SELECT registros FROM registro_calidad WHERE regla = 'RN-09'"
    ).fetchone()
    assert excluidos == 1
    assert cifra(con, nivel="nacional", grupo_edad="60+", sexo=None) is None


def test_rn06_sexo_invalido_cuenta_en_total_pero_no_en_desglose(con):
    sexos = {
        s for (s,) in con.execute(
            "SELECT DISTINCT sexo FROM mart_participacion WHERE nivel = 'nacional' AND grupo_edad IS NULL"
        ).fetchall()
    }
    assert sexos == {None, "H", "M"}  # None = ambos sexos (total), sin categoría espuria
    assert cifra(con, nivel="nacional", grupo_edad=None, sexo="H") == pytest.approx(50 / 90)


def test_rn05_municipio_bajo_umbral_se_suprime(con):
    suprimido, participacion = con.execute(
        "SELECT suprimido, participacion FROM mart_participacion "
        "WHERE nivel = 'municipio' AND cve_municipio = 117 AND grupo_edad IS NULL AND sexo IS NULL"
    ).fetchone()
    assert suprimido is True and participacion is None


def test_rf23_detecta_diferencias_mayores_a_un_punto(con, tmp_path: Path):
    oficiales = tmp_path / "oficiales.csv"
    calculada = 185 / 290 * 100
    oficiales.write_text(
        "id_eleccion,nivel,cve_entidad,participacion_pct\n"
        f"2024,nacional,,{calculada + 0.5:.2f}\n"
        f"2024,entidad,14,{calculada + 3:.2f}\n",
        encoding="utf-8",
    )
    diferencias = validar_oficiales(con, oficiales, 1.0)
    assert [(d[1], d[2]) for d in diferencias] == [("entidad", 14)]
