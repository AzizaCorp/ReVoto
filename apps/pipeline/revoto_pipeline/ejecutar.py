"""Utilidades para correr los pasos SQL y la validación. Se usan también en las pruebas."""

from __future__ import annotations

from pathlib import Path

import duckdb


def ejecutar_pasos(con: duckdb.DuckDBPyConnection, carpeta: Path, contexto: dict) -> list[str]:
    """Ejecuta los .sql de `carpeta` en orden alfabético (10_, 20_, …).

    Los marcadores {{nombre}} se sustituyen con valores de `contexto`. Solo se admiten
    rutas y enteros, para que ningún valor libre termine dentro del SQL.
    """
    ejecutados = []
    for archivo in sorted(carpeta.glob("*.sql")):
        sql = archivo.read_text(encoding="utf-8")
        for clave, valor in contexto.items():
            if not isinstance(valor, (int, str)) or (isinstance(valor, str) and "'" in valor):
                raise ValueError(f"Valor no permitido para {{{{{clave}}}}}: {valor!r}")
            sql = sql.replace("{{" + clave + "}}", str(valor))
        con.execute(sql)
        ejecutados.append(archivo.name)
    return ejecutados


def validar_oficiales(con: duckdb.DuckDBPyConnection, csv: Path, max_pp: float) -> list[tuple]:
    """RF-23: regresa los indicadores cuya diferencia contra la cifra oficial supera `max_pp`."""
    sql = (Path(__file__).parent / "validacion" / "validar.sql").read_text(encoding="utf-8")
    sql = sql.replace("{{ruta_oficiales}}", csv.as_posix()).replace("{{max_pp}}", str(float(max_pp)))
    return con.execute(sql).fetchall()
