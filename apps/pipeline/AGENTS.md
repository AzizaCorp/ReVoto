# pipeline · Contexto para agentes

Pipeline fuera de línea en **Python 3.12 + DuckDB**. Transforma el parquet consolidado (L1, 54.8 M filas) en el modelo normalizado (L2), los marts (L3) y el contrato JSON (L4). **No corre en producción ni en CI** con datos reales.

## Flujo

`python -m revoto_pipeline` (desde `apps/pipeline`) ejecuta `revoto_pipeline/sql/*.sql` en orden, valida contra cifras oficiales y solo entonces exporta:

| Paso | Archivo | Regla |
| --- | --- | --- |
| 10 | `revoto_pipeline/sql/10_staging.sql` | Vista sobre el parquet L1 |
| 20 | `revoto_pipeline/sql/20_dimensiones.sql` | Catálogos; grupos de edad RN-04; tipos de elección RN-03 |
| 30 | `revoto_pipeline/sql/30_hechos.sql` | Tabla de hechos tipada con `TRY_CAST` |
| 40 | `revoto_pipeline/sql/40_calidad.sql` | RN-09 (edad), RN-06 (sexo), bitácora `registro_calidad` (RF-24) |
| 50 | `revoto_pipeline/sql/50_marts.sql` | `GROUPING SETS` nacional/entidad/municipio × edad/sexo; RN-01 |
| 60 | `revoto_pipeline/sql/60_umbral.sql` | RN-05: suprime municipios bajo el umbral |
| — | `revoto_pipeline/validacion/validar.sql` | RF-23: falla si alguna diferencia > 1 pp |
| — | `revoto_pipeline/exportar.py` | L3 → L4 (pendiente US-06) |
| — | `revoto_pipeline/convertir_v2.py` | **Puente transitorio (ADR-0005):** JSON v2 de US-06 + marco INEGI + `insumos/` → L4 completo (JSON, geo, mapa, calidad, CSV, manifiesto) |
| — | `revoto_pipeline/presupuesto.py` | RNF-04: límites de `budget.json` |

## Reglas

- **Nunca** subas `data/`, parquet, XLSX, shapefiles ni `.duckdb` (están en `.gitignore`).
- Los valores de reglas (umbral RN-05, máximo de RF-23) viven en `config.toml`, nunca en el SQL. Mientras `umbral_rn05 = "POR_DEFINIR"`, el pipeline se detiene a propósito.
- Los marcadores `{{nombre}}` del SQL los sustituye `revoto_pipeline/ejecutar.py`; solo acepta rutas y enteros.
- Toda regla nueva lleva su prueba en `tests/test_reglas.py` con datos sintéticos.
- La forma de los JSON que exporta está en `packages/contracts` (tipos y JSON Schema): cámbiala ahí en el mismo PR.
- Las reglas que también usa la app (RN-01, RN-03, RN-04) tienen su versión en `apps/web/src/domain`; si cambias una, cambia la otra.
- Un PR de datos usa la rama `data/US-NN-slug`, el tipo de commit `data(pipeline:US-NN)` y adjunta el reporte de `apps/pipeline/reportes/`.

## Puente v2 → L4 (`convertir_v2.py`)

- Entradas: los JSON *frontend v2* de `feat/US-06-dataset-pipeline`, `00ent.shp` y `00mun.shp` del marco geoestadístico INEGI, y `insumos/` (catálogos INEGI, `arquetipos_municipales.csv`, `votos_esperados_por_entidad_edad.csv`).
- Requiere `mapshaper` (npm) para la geometría: `snap`, proyección EPSG:6372 y TopoJSON (ADR-0004).
- Las claves INE e INEGI difieren en 1 372 municipios: el cruce va por `cvegeo` y los cruces por respaldo quedan en `calidad.json`.
- Pruebas: `tests/test_convertir_v2.py`. Comando completo en `apps/web/public/data/README.md` y en DIS v0.4 §4.7.

## Comandos

```powershell
cd apps/pipeline
python -m venv .venv; .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest -q
python -m revoto_pipeline
```
