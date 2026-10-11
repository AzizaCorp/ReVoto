"""Pruebas de reglas de negocio sobre un parquet sintético pequeño (no usan datos reales)."""

from __future__ import annotations

import csv
from pathlib import Path

import duckdb
import pytest

from revoto_pipeline.validation.schemas import INE_COLUMNS, SchemaError, check_header
from revoto_pipeline.transform.inegi import find_sex_pairs
from revoto_pipeline.transform.conapo import CONAPO_SEX_MAP
from revoto_pipeline.geo.crosswalk import dms_to_decimal

SQL = Path(__file__).resolve().parent.parent / "revoto_pipeline" / "sql"
COLUMNAS = "AELEC, EDOCVE, MPIOCVE, SECCION, SEXO, EDAD, LN, SV, NV, NS, source_file"

# (año, entidad, municipio, sección, sexo, edad, LN, SV, NV, NS)
FILAS = [
    (2024, 14, 39, 1, 0, 20, 100, 50, 40, 10, ' ', ' '),
    (2024, 14, 39, 1, 1, 30, 100, 70, 20, 10, '2', '15'),
    (2024, 14, 39, 2, 2, 40, 100, 60, 40, 0, '2', 'bad'),  # sexo fuera de catálogo
    (2024, 14, 39, 2, 0, 140, 100, 99, 1, 0, '2', '15'),  # edad atípica, NO filtrada
    (2024, 14, 117, 3, 1, 50, 10, 5, 5, 0, '2', '15'),  # municipio pequeño
]

def escribir_ine(path: Path, filas: list[tuple] = FILAS) -> Path:
    """Escribe un CSV realista, con todos los encabezados requeridos."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=INE_COLUMNS)
        writer.writeheader()
        for (year, state, mun, sec, sex, age, ln, sv, nv, ns, defe, del_) in filas:
            writer.writerow({
                'AELEC': year, 'FELECCION': '2/6/2024',
                'EDOCVE': state, 'EDONOM': 'JALISCO',
                'MPIOCVE': mun, 'MPIONOM': 'MUNICIPIO SINTETICO',
                'SECCION': sec, 'TIPOSEC': 'U', 'DEF': defe, 'DEL': del_,
                'SEXO': sex, 'EDAD': age, 'LN': ln, 'SV': sv, 'NV': nv, 'NS': ns,
            })
    return path

@pytest.fixture()
def con(tmp_path: Path):
    """Staging de INE v2 ejecutado realmente sobre CSV sintético."""
    duckdb = pytest.importorskip('duckdb')
    from revoto_pipeline.transform.ine import ine_select
    from revoto_pipeline.sql_utils import copy_parquet

    source = escribir_ine(tmp_path / 'ine.csv')
    parquet = tmp_path / 'conteos.parquet'
    connection = duckdb.connect(':memory:')
    copy_parquet(connection, ine_select(source, 2024), parquet)
    try:
        yield connection, parquet
    finally:
        connection.close()


def test_esquema_inesperado(tmp_path: Path):
    source = tmp_path / 'ine.csv'
    source.write_text(','.join([*INE_COLUMNS, 'EXTRA']) + '\n', encoding='utf-8')
    with pytest.raises(SchemaError, match='inesperadas'):
        check_header(source, INE_COLUMNS, exact=True)


def test_pares_sexo_inegi_solo_si_existen_columnas_oficiales():
    pares = find_sex_pairs([
        'POB_AFRO', 'POB_AFRO_F', 'POB_AFRO_M',
        'POBTOT', 'POBFEM', 'POBMAS', 'PCON_DISC',
    ])
    assert pares['POB_AFRO'] == ('POB_AFRO_F', 'POB_AFRO_M')
    assert pares['POBTOT'] == ('POBFEM', 'POBMAS')
    assert 'PCON_DISC' not in pares


def test_sexo_conapo_homologado():
    assert CONAPO_SEX_MAP == {'HOMBRES': 0, 'MUJERES': 1}


def test_coordenadas_iter_y_valor_suprimido():
    assert dms_to_decimal('95°42\'19.854" W') == pytest.approx(-95.705515)
    assert dms_to_decimal('17°20\'25.133" N') == pytest.approx(17.34031472)
    assert dms_to_decimal('*') is None


def test_distritos_vacios_y_token_invalido_se_conservan(con):
    c, parquet = con
    from revoto_pipeline.config import sql_path

    result = c.execute(f'''
        SELECT SEXO, DEF, DEL, missing_def, missing_del,
               invalid_def_token, invalid_del_token
        FROM read_parquet('{sql_path(parquet)}')
        WHERE MPIOCVE = 39 AND (EDAD = 20 OR EDAD = 40)
        ORDER BY EDAD
    ''').fetchall()
    assert result == [
        (0, None, None, True, True, False, False),
        (2, 2, None, False, True, False, True),
    ]
    assert c.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(parquet)}')").fetchone()[0] == 5


def test_calidad_diferencia_errores_y_alertas(con):
    c, parquet = con
    from revoto_pipeline.validation.quality import ine_quality, assert_ine_quality

    report = ine_quality(c, parquet, 2024, 14)
    assert report['rows'] == 5
    assert report['missing_def'] == 1
    assert report['missing_del'] == 2
    assert report['invalid_del_token'] == 1
    assert report['unexpected_sex'] == 1
    assert report['wrong_year'] == report['wrong_state'] == 0
    assert report['bad_key'] == report['bad_counts'] == 0
    assert report['mismatch_ln'] == 0
    assert_ine_quality(report)  # anomalías no bloqueantes permanecen reportadas


def test_participacion_actual_usa_sv_sobre_ln_no_ln_menos_ns(con):
    c, parquet = con
    from revoto_pipeline.transform.ine import municipality_select

    results = c.execute(municipality_select(parquet)).fetchall()
    by_mun = {row[2]: row for row in results}
    assert by_mun[39][3:7] == (400, 279, 101, 20)  # LN, SV, NV, NS
    assert by_mun[39][-1] == pytest.approx(69.75)
    assert by_mun[117][-1] == pytest.approx(50.0)
    # Contrato actual: se conserva edad 140 y sexo=2 en el total municipal.


def test_desglose_sexo_actual_conserva_codigo_inesperado(con):
    c, parquet = con
    from revoto_pipeline.transform.ine import municipality_select

    rows = c.execute(municipality_select(parquet, by_sex=True)).fetchall()
    # Se documenta el comportamiento ACTUAL, no la regla RN-06 antigua.
    groups = {(row[2], row[3]): row[-1] for row in rows}
    assert groups[(39, 0)] == pytest.approx(149 / 200 * 100)
    assert groups[(39, 1)] == pytest.approx(70.0)
    assert groups[(39, 2)] == pytest.approx(60.0)


def test_conteos_no_numericos_detienen_quality_gate(tmp_path: Path):
    duckdb = pytest.importorskip('duckdb')
    from revoto_pipeline.transform.ine import ine_select
    from revoto_pipeline.sql_utils import copy_parquet
    from revoto_pipeline.validation.quality import ine_quality, assert_ine_quality

    source = escribir_ine(tmp_path / 'ine.csv', [(*FILAS[0][:6], 'oops', *FILAS[0][7:])])
    parquet = tmp_path / 'conteos.parquet'
    with duckdb.connect(':memory:') as connection:
        copy_parquet(connection, ine_select(source, 2024), parquet)
        report = ine_quality(connection, parquet, 2024, 14)