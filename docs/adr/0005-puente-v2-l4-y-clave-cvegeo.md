# ADR-0005 · Puente transitorio v2 → L4 y CVEGEO como clave de cruce INE/INEGI

- **Estado:** Reemplazada (18/10/2026, contrato de US-06)
- **Fecha:** 18/10/2026
- **Decisores:** Angel (Architecture owner), Kira (Responsable de datos)

## Contexto

La rama `feat/US-06-dataset-pipeline` produce JSON con una estructura propia (*frontend v2*), distinta del contrato L4 de `packages/contracts`. La app necesitaba datos reales para US-09, US-11, US-14 y US-15 antes de que `exportar.py` estuviera listo.

Además, las claves municipales del INE y del INEGI **no coinciden en 1 372 de 2 477 municipios**, así que no se puede unir cifra con geometría por `cve_entidad + cve_municipio`.

## Decisión

- `apps/pipeline/revoto_pipeline/convertir_v2.py` lee la salida v2, el marco geoestadístico INEGI y los insumos de `apps/pipeline/insumos/`, y escribe el contrato L4 completo: JSON, geometría (ADR-0004), `mapa/participacion.json`, `calidad.json`, CSV y manifiesto.
- El contrato L4 se **extiende** de forma compatible: `cvegeo`, `vecinos` (claves INE de la misma entidad), `arquetipo`, `votos_esperados_por_edad`, `nombreEntidad`; `validacion.max_diferencia_pp` admite `null` mientras RF-23 no tenga cifras oficiales.
- **CVEGEO** (clave INEGI de 5 dígitos) es la clave de cruce con la geometría. Los archivos se siguen nombrando por la clave INE (`municipio/<ent>-<mun>.json`).
- El cruce INE → INEGI (`cruce_ine_inegi`) toma el `cvegeo` de `insumos/arquetipos_municipales.csv`. A los que no lo traen les aplica, en orden, dos reglas de respaldo: la misma clave si nadie la usa, o la única clave INEGI libre de la entidad. Hoy son 10 municipios y quedan listados en `calidad.json` para su verificación manual. Nunca se supone que las claves son iguales salvo como último recurso.

## Alternativas consideradas

- **Cambiar el contrato a la forma v2:** obligaba a reescribir esquemas, DTO y mapeadores y rompía la regla de ADR-0003.
- **Esperar a `exportar.py`:** bloqueaba US-11, US-14 y US-15 hasta el Sprint 3.
- **Renombrar archivos por CVEGEO:** rompe RN-10 al mostrar claves distintas a las del INE y obliga a migrar la app.

## Consecuencias

- La app ya funciona con datos reales; cuando `exportar.py` exista, debe producir **la misma salida** y `convertir_v2.py` se retira (o queda como último paso del pipeline de US-06).
- Desglose de edad y sexo solo a nivel nacional y entidad hasta que el pipeline lo calcule por municipio.
- Los 10 cruces de respaldo son un riesgo de dato equivocado en el mapa; se verifican antes de promover a `staging`.
- Pruebas: `apps/pipeline/tests/test_convertir_v2.py`; validación con `npm run check:data` y `npm run check:budget`.

## Actualización (18/10/2026) · Reemplazada

El contrato L4 oficial es el del pipeline de US-06 (`packages/contracts/schemas`, commit `af22fc1`). `convertir_v2.py`, sus insumos y su prueba se retiraron. La identidad de un municipio es su `id_operativo` (en la app, `Territory.key`); `cvegeo` solo sirve para unir con la geometría y los vecinos se expresan como `id_operativo`.
