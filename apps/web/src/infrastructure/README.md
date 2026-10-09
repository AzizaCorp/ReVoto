# infrastructure

Adaptadores que implementan los puertos de `application`. Es la única capa que conoce `fetch`, rutas de archivos y los DTO de `@revoto/contracts`.

- `json-estatico/ClienteJson.ts` · lee `manifest.json` sin caché y los archivos de `/data/<version>/`; traduce fallas a `DatosNoDisponibles`.
- `json-estatico/mapeadores.ts` · DTO del contrato L4 → modelo de dominio.
- `json-estatico/JsonParticipacionRepository.ts` · implementa `ParticipacionRepository`.

Un adaptador nuevo (por ejemplo, una API) se agrega como carpeta hermana y se elige en `src/main.tsx`.
