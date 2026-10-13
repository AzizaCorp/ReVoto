# infrastructure

Adaptadores que implementan los puertos de `application`. Es la única capa que conoce `fetch`, rutas de archivos y los DTO de `@revoto/contracts`.

- `static-json/JsonClient.ts` · lee `manifest.json` sin caché y los archivos de `/data/<version>/`; traduce fallas a `DataUnavailable`. `src/main.tsx` crea uno solo para que todos los puertos usen la misma versión.
- `static-json/mappers.ts` · DTO del contrato L4 → modelo de dominio (series, resumen municipal, arquetipo, reporte de calidad).
- `static-json/JsonTurnoutRepository.ts` · implementa `TurnoutRepository`: entidades, municipios, series, panorama de la entidad y perfil del municipio.
- `static-json/JsonGeographyRepository.ts` · implementa `GeographyRepository` (mapas de W-02, W-03 y W-04); `topology.ts` decodifica el TopoJSON.
- `static-json/JsonQualityRepository.ts` · implementa `QualityRepository` (W-20).
- `static-json/realData.test.ts` · prueba de contrato contra los archivos publicados en `public/data`.

Un adaptador nuevo (por ejemplo, una API) se agrega como carpeta hermana y se elige en `src/main.tsx`.
