# ADR-0001 · Sitio estático con pipeline fuera de línea

- **Estado:** Propuesta (pendiente de evaluación formal DAR y aprobación)
- **Fecha:** 08/10/2026
- **Decisores:** Angel (Architecture owner), Kira

## Contexto

RNF-17 exige que el MVP se despliegue como sitio estático. Los datos de origen tienen 54.8 M filas, pero RN-02 prohíbe publicar secciones, así que todo lo visible se puede precalcular por entidad y municipio. Las cifras deben seguir disponibles durante la evaluación del jurado (RNF-05).

## Decisión

Un pipeline en Python + DuckDB corre fuera de línea, valida contra cifras oficiales y genera JSON por entidad y municipio. Vercel sirve el sitio y los JSON como archivos estáticos. No hay servidor de aplicaciones ni base de datos en producción.

## Alternativas consideradas

Backend en Vercel con Postgres gestionado, backend en Google Cloud (BigQuery o Cloud SQL + Cloud Run), y DuckDB-WASM en el navegador. Ver DIS-REVOTO-ARQUITECTURA-DESPLIEGUE §2.

## Consecuencias

- Costo $0 y ninguna pieza en línea que pueda fallar además del CDN.
- No hay consultas libres: todo corte nuevo requiere cambiar el pipeline.
- El frontend lee datos solo por el puerto `ParticipacionRepository` (ADR-0003), para poder agregar un adaptador de API sin reescribir la app.
- **Se reabre** si una historia requiere consultas no precalculables o si un archivo L4 excede 300 KB aun dividido.
