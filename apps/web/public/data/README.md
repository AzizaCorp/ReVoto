# public/data · Contrato L4 (generado)

**No edites estos archivos a mano.** Hoy los escribe `apps/pipeline/revoto_pipeline/convertir_v2.py` a partir de los JSON *frontend v2* de la rama `feat/US-06-dataset-pipeline`; cuando `exportar.py` (L3 → L4) esté listo, lo sustituye con la misma salida.

```text
public/data/
├─ manifest.json                  # sin caché: versión vigente + reporte de validación
└─ <AAAAMMDD-hash7>/              # versión inmutable
   ├─ nacional.json               # 6 elecciones, edad y sexo (suma de conteos de las 32 entidades)
   ├─ catalogos/entidades.json    # 32 entidades, nombres INEGI
   ├─ entidad/<cve>.json          # serie, votos esperados por edad (W-09b) y sus municipios (≤ 300 KB)
   ├─ municipio/<ent>-<mun>.json  # serie, cvegeo, vecinos (W-04) y arquetipo (W-09) (≤ 20 KB)
   ├─ calidad.json                # reglas verificadas (W-20)
   ├─ geo/entidades.topo.json     # contorno de las 32 entidades
   ├─ geo/<cve>.topo.json         # municipios de la entidad, TopoJSON simplificado (≤ 300 KB)
   └─ csv/participacion.csv       # datos abiertos con conteos (US-22)
```

Regenerar, desde la raíz del repositorio:

```bash
mkdir -p /tmp/v2 && git archive feat/US-06-dataset-pipeline apps/web/public/data | tar -x -C /tmp/v2
PYTHONPATH=apps/pipeline python3 -m revoto_pipeline.convertir_v2 \
  --v2 /tmp/v2/apps/web/public/data --marco <carpeta con 00mun.shp y 00ent.shp> \
  --salida apps/web/public/data
npm run check:data && npm run check:budget
```

Limitaciones de esta versión:

- Edad y sexo solo a nivel nacional y entidad: el desglose municipal se calcula desde la sección en el pipeline (pendiente).
- RF-23 pendiente: `cifras_oficiales.csv` no tiene filas, por eso `max_diferencia_pp` es `null`.
- 10 municipios se cruzaron con INEGI por regla de respaldo; `calidad.json` los lista para verificarlos.

Esquemas: `packages/contracts/schemas/`. Validación en CI: `npm run check:data`.
