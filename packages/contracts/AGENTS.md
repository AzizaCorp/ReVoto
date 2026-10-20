# packages/contracts · Contexto para agentes

Contrato de datos **L4**: la forma exacta de los JSON que `apps/pipeline` publica y que `apps/web/src/infrastructure` lee. **La fuente de verdad son los JSON Schema de `schemas/`**, que reflejan lo que escribe el pipeline de US-06 (`export/exportar_ine_exploratorio.py` y `export/enriquecer.py`).

| Archivo | Qué es |
| --- | --- |
| `schemas/*.schema.json` | `comun`, `manifest`, `nacional`, `entidades`, `entidad`, `municipio`, `calidad`. El pipeline valida con ellos antes de publicar y `npm run check:data` repite la validación en CI. |
| `src/l4.ts` | Los mismos DTO en TypeScript (`ManifiestoDto`, `DatosEntidadDto`, `DatosMunicipioDto`, `CifrasEleccionDto`…), en `snake_case` igual que el JSON. |

## Estructura publicada

```text
<versión AAAAMMDD-hash7>/
├─ manifest.json                         # versión, estado_publicacion, rutas (catálogo, nacional, topologías)
├─ nacional.json
├─ calidad.json                          # cobertura, validación oficial, geometría, integridad
├─ catalogos/entidades.json              # [{cve, nombre, archivo}]
├─ catalogos/municipios/<slug>.json      # resúmenes municipales por entidad
├─ entidad/<slug>.json                   # p. ej. entidad/queretaro.json
├─ municipio/<slug-entidad>/<cvegeo>_<slug>.json
├─ municipio/<ent>-<mun>.json            # alias por clave INE cuando no es ambigua
├─ geo/entidades.topo.json · geo/<slug>.topo.json
└─ validacion/                           # trazabilidad INE, colisiones, claves ambiguas
```

## Reglas

- **No es el modelo de dominio.** Los DTO solo se importan en `apps/web/src/infrastructure`; ESLint lo bloquea en las demás capas.
- **Esquemas, `src/l4.ts`, el exportador del pipeline y los mapeadores de la app cambian juntos**, en el mismo PR. Un cambio incompatible es `BREAKING CHANGE`.
- Las rutas de los archivos **se leen del manifiesto y del campo `archivo`**, no se construyen a mano.
- Un municipio se identifica por `territorio.id_operativo`; `vecinos` usa esos identificadores. `cvegeo` solo aparece si la equivalencia con INEGI está verificada (`cvegeo_candidato` si es inequívoca pero no verificada).
- RN-05 se aplica **por elección**: una elección sin tasa trae `estado_tasa` y nunca `participacion`. `suprimido` del municipio es `true` solo si todas lo están.
- Proporciones de 0 a 1. Nunca campos de sección electoral, edad simple ni datos personales (RN-02, RN-04, RNF-13).
