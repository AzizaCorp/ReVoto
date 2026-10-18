---
name: flujo-ddd
description: Agrega una funcionalidad a apps/web atravesando las capas DDD de ReVoto (dominio → caso de uso → puerto → adaptador → hook → página). Úsalo cuando una historia necesite una regla nueva, datos nuevos o una pantalla que consulte datos.
---

# Agregar una funcionalidad con DDD en ReVoto

Lee antes `docs/adr/0003-ddd-en-la-app-web.md` y `apps/web/AGENTS.md`. Trabaja **de adentro hacia afuera** y prueba cada capa antes de pasar a la siguiente.

## 1. Dominio · `apps/web/src/domain/<modulo>/`

- ¿La historia trae una regla (RN-NN), un cálculo o un concepto nuevo? Modélalo como tipo y función pura.
- Usa los conceptos existentes: `Election`, `Territory`, `Proportion`, `Figure`, `TurnoutSeries`, `Sequence` (el código va en inglés; la UI en español).
- Prueba en `<Modulo>.test.ts`. Sin React, sin `fetch`, sin DTO.

## 2. Caso de uso · `apps/web/src/application/use-cases/`

- Una función por flujo del SRS (`CU-NN`), que recibe el repositorio como primer parámetro.
- Si necesita algo nuevo del exterior, **agrega un método al puerto** (`ports/TurnoutRepository.ts`, `GeographyRepository.ts`, `QualityRepository.ts`, `OpenDataRepository.ts`) o crea un puerto nuevo; no llames `fetch`.
- Exporta desde `application/index.ts`. Prueba con un repositorio falso (ver `compareTerritory.test.ts` y `apps/web/src/test/memoryRepositories.ts`).

## 3. Adaptador · `apps/web/src/infrastructure/static-json/`

- Implementa el método nuevo del puerto en el `Json*Repository` correspondiente.
- Si el JSON cambia, actualiza **en el mismo PR**: `packages/contracts/src/l4.ts`, `packages/contracts/schemas/`, `mappers.ts` y el productor del L4 (hoy `apps/pipeline/revoto_pipeline/convertir_v2.py`, ADR-0005; después `exportar.py`).
- Los DTO se traducen a dominio en `mappers.ts` y no salen de esta capa.
- Prueba con un `fetch` falso (ver `JsonTurnoutRepository.test.ts`).

## 4. Hook · `apps/web/src/presentation/hooks/`

- `useAlgo(params)` obtiene el repositorio con `useDependencias()`, llama al caso de uso y expone `{ estado: 'cargando' | 'error' | 'listo', datos, aviso, reintentar }` para W-17.

## 5. Página y componentes · `apps/web/src/presentation/`

- La página (`pages/W-NN…tsx`) usa el hook y pasa datos de dominio a los componentes.
- Los componentes viven en `components/` (skill `componente-atomico`) y solo reciben props.
- Toda cifra llega como `Cifra` y se muestra con `CifraConContexto` (RN-10).

## 6. Composición · `apps/web/src/main.tsx`

Solo si agregaste un adaptador nuevo: créalo aquí e inyéctalo en `ProveedorDependencias`.

## 7. Verifica

```powershell
npm run check
```

ESLint falla si alguna capa importa una que no debe. Commit por capa o uno por historia: `feat(web:US-NN): …`.
