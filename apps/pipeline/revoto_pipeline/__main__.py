"""Punto de entrada único (RNF-16): `python -m revoto_pipeline` desde apps/pipeline.

Ejecuta los SQL de pipeline/sql en orden, valida contra cifras oficiales (RF-23) y,
solo si todo pasa, exporta el contrato L4 y verifica su peso. Termina con código 1 ante
cualquier falla, sin tocar apps/web/public/data.
"""

from __future__ import annotations

import sys
import tomllib
from pathlib import Path

import duckdb

from revoto_pipeline.ejecutar import ejecutar_pasos, validar_oficiales

PAQUETE = Path(__file__).resolve().parent
APP = PAQUETE.parent  # apps/pipeline
RAIZ = APP.parent.parent  # raíz del repositorio


def cargar_config() -> dict:
    with open(APP / "config.toml", "rb") as f:
        config = tomllib.load(f)
    umbral = config["reglas"]["umbral_rn05"]
    if not isinstance(umbral, int):
        sys.exit("✖ Define reglas.umbral_rn05 en apps/pipeline/config.toml con el valor de RN-05 del SRS.")
    return config


def main() -> int:
    config = cargar_config()
    rutas = config["rutas"]
    staging = RAIZ / rutas["staging"]
    if not staging.exists():
        print(f"✖ No existe {staging}. Descárgalo del bucket de fuentes (ver apps/pipeline/README.md).")
        return 1

    (RAIZ / rutas["base"]).parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(RAIZ / rutas["base"]))
    ejecutar_pasos(
        con,
        PAQUETE / "sql",
        {"ruta_staging": staging.as_posix(), "umbral_rn05": config["reglas"]["umbral_rn05"]},
    )

    diferencias = validar_oficiales(
        con, RAIZ / rutas["oficiales"], config["reglas"]["max_diferencia_pp"]
    )
    if diferencias:
        print(f"✖ RF-23: {len(diferencias)} indicadores difieren más de lo permitido. No se exporta.")
        for fila in diferencias[:20]:
            print("   ", fila)
        return 1

    from revoto_pipeline.exportar import exportar  # noqa: PLC0415  (se implementa en US-06)
    from revoto_pipeline.presupuesto import verificar

    exportar(con, RAIZ / rutas["salida"], RAIZ / rutas["reportes"])
    return 0 if verificar(RAIZ / rutas["salida"], RAIZ / "budget.json") else 1


if __name__ == "__main__":
    raise SystemExit(main())
