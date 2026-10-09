# packages/contracts · Contexto para agentes

Contrato de datos **L4**: la forma exacta de los JSON que `apps/pipeline` escribe en `apps/web/public/data` y que `apps/web/src/infrastructure` lee.

| Archivo | Qué es |
| --- | --- |
| `src/l4.ts` | Tipos DTO (`ManifiestoDto`, `SerieNacionalDto`, `DatosEntidadDto`, `DatosMunicipioDto`, `CifrasEleccionDto`…). Usan `snake_case` igual que el JSON. |
| `schemas/*.schema.json` | El mismo contrato en JSON Schema. `npm run check:data` valida los datos contra ellos. |

## Reglas

- **No es el modelo de dominio.** Los DTO solo se importan en `apps/web/src/infrastructure`; ESLint lo bloquea en las demás capas.
- **Tipos, esquemas y `apps/pipeline/revoto_pipeline/exportar.py` cambian juntos**, en el mismo PR, junto con `infrastructure/json-estatico/mapeadores.ts`. Un cambio incompatible es `BREAKING CHANGE`.
- Proporciones de 0 a 1. Nunca campos de sección electoral, edad simple ni datos personales (RN-02, RN-04, RNF-13).
