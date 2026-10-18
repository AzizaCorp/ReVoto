# packages/contracts · Contexto para agentes

Contrato de datos **L4**: la forma exacta de los JSON que `apps/pipeline` escribe en `apps/web/public/data` y que `apps/web/src/infrastructure` lee.

| Archivo | Qué es |
| --- | --- |
| `src/l4.ts` | Tipos DTO (`ManifiestoDto`, `SerieNacionalDto`, `DatosEntidadDto`, `DatosMunicipioDto`, `CifrasEleccionDto`, `ArquetipoDto`, `CalidadDto`, `TopologiaDto`, `MapaParticipacionDto`…). Usan `snake_case` igual que el JSON. |
| `schemas/*.schema.json` | El mismo contrato en JSON Schema (`comun`, `manifest`, `nacional`, `entidades`, `entidad`, `municipio`, `calidad`, `geo`, `mapa`). `npm run check:data` valida los datos contra ellos. |

Estructura de archivos y campos: `apps/web/public/data/README.md` y `docs/diseno/DIS-REVOTO-ARQUITECTURA-DESPLIEGUE-v0.4.md` §5.

## Reglas

- **No es el modelo de dominio.** Los DTO solo se importan en `apps/web/src/infrastructure`; ESLint lo bloquea en las demás capas.
- **Tipos, esquemas y el productor del L4 cambian juntos**, en el mismo PR, junto con `apps/web/src/infrastructure/static-json/mappers.ts`. Hoy el productor es `apps/pipeline/revoto_pipeline/convertir_v2.py` (puente transitorio, ADR-0005); después será `exportar.py`. Un cambio incompatible es `BREAKING CHANGE`.
- La clave de cruce con la geometría es `cvegeo` (INEGI); los nombres de archivo usan la clave INE. Nunca supongas que son iguales.
- Proporciones de 0 a 1. Nunca campos de sección electoral, edad simple ni datos personales (RN-02, RN-04, RNF-13).
