"""L3 → L4. Escribe el contrato de DIS-REVOTO-ARQUITECTURA-DESPLIEGUE §5 en apps/web/public/data.

Se implementa en US-06. Debe:
1. Calcular version_datos = AAAAMMDD-<hash corto del contenido>.
2. Borrar la carpeta de la versión anterior y escribir la nueva (nacional, catálogos, entidad/<cve>,
   municipio/<ent>-<mun>, csv/participacion.csv).
3. Escribir manifest.json al final, para que nunca apunte a una versión incompleta.
4. Escribir el reporte de validación en apps/pipeline/reportes/<AAAAMMDD>.md.
Los archivos deben validar contra packages/contracts/schemas (npm run check:data).
"""

from __future__ import annotations

from pathlib import Path

import duckdb


def exportar(con: duckdb.DuckDBPyConnection, salida: Path, reportes: Path) -> None:
    raise NotImplementedError("Exportación L4 pendiente de US-06")
