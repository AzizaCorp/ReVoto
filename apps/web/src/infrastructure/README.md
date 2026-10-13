# infrastructure

Adaptadores que implementan los puertos de `application`. Es la única capa que conoce `fetch`, rutas de archivos y los DTO de `@revoto/contracts`.

- `static-json/JsonClient.ts` · lee `manifest.json` sin caché y los archivos de `/data/<version>/`; traduce fallas a `DataUnavailable`.
- `static-json/mappers.ts` · DTO del contrato L4 → modelo de dominio.
- `static-json/JsonTurnoutRepository.ts` · implementa `TurnoutRepository`.

Un adaptador nuevo (por ejemplo, una API) se agrega como carpeta hermana y se elige en `src/main.tsx`.
