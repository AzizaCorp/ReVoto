"""RNF-04: verifica que cada archivo L4 quede dentro de los límites de budget.json."""

from __future__ import annotations

import json
from pathlib import Path

KB = 1024


def verificar(salida: Path, budget: Path) -> bool:
    limites = json.loads(budget.read_text(encoding="utf-8"))
    ok = True
    for archivo in salida.rglob("*.json"):
        partes = archivo.relative_to(salida).parts
        limite = (
            limites["entidad_kb"] if "entidad" in partes
            else limites["municipio_kb"] if "municipio" in partes
            else None
        )
        tam = archivo.stat().st_size
        if limite is not None and tam > limite * KB:
            print(f"✖ {archivo.relative_to(salida)}: {tam / KB:.1f} KB > {limite} KB")
            ok = False
    if ok:
        print("✔ Archivos L4 dentro del presupuesto")
    return ok
