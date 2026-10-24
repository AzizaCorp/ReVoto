# public/data · Contrato L4 (generado)

**No edites estos archivos a mano.** Es el contenido de una carpeta de versión que publica el pipeline de US-06 (`apps/pipeline/revoto_pipeline/export/exportar_ine_exploratorio.py`). La forma de cada archivo está en `packages/contracts/schemas/` y `npm run check:data` la valida.

```text
public/data/
├─ nacional.json                              # 6 elecciones, edad y sexo
├─ catalogos/entidades.json                   # [{cve, nombre, archivo}] de las 32 entidades
├─ entidad/<slug>.json                        # serie, votos esperados por edad, perfil y municipios con su `archivo`
├─ municipio/<slug-entidad>/<cvegeo>_<slug>.json  # serie con edad y sexo, vecinos (id_operativo) y arquetipo
├─ geo/entidades.topo.json                    # 32 entidades (W-02, W-03)
├─ geo/<slug>.topo.json                       # municipios de la entidad, por CVEGEO (W-03, W-04)
├─ manifest.json · calidad.json               # opcionales: versión y reporte de calidad (W-16, W-20)
└─ csv/participacion.csv                      # opcional: datos abiertos (W-16)
```

`data/descargas/*.csv|json` (W-16) no vive aquí: el plugin `src/infrastructure/open-data/vitePlugin.ts` lo genera en cada `vite build` (y lo sirve en `vite dev`) a partir de estos archivos: participación por territorio, por edad y sexo y arquetipos, una fila por territorio y elección.

La app encuentra todo desde `catalogos/entidades.json` y el campo `archivo`; nunca arma rutas a mano. La geometría está en WGS84 (lon, lat) y la app la proyecta al dibujarla.

Estado de esta copia (18/10/2026):

- `catalogos/entidades.json` y `geo/entidades.topo.json` se derivaron aquí con la misma forma que escribe el exportador: el catálogo desde las 32 entidades y el mapa desde `00ent.shp` del marco INEGI (mapshaper, `snap`, WGS84, simplificación 1.5 %, cuantización 100 000). Al publicar la siguiente versión completa del pipeline se reemplazan.
- No hay `manifest.json`, `calidad.json` ni `csv/`: W-20 muestra las verificaciones como pendientes. Las descargas de W-16 salen de `data/descargas/` (ver arriba).
- 52 municipios sin CVEGEO (identidad territorial sin resolver) aparecen en su entidad pero su archivo no está publicado; la app no los ofrece para elegir.
