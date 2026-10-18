# ADR-0004 · Mapas proyectados en el pipeline y dibujados en SVG sin librería

- **Estado:** Reemplazada parcialmente (ver «Actualización»)
- **Fecha:** 18/10/2026
- **Decisores:** Angel (Architecture owner)

## Contexto

W-02 (entidades), W-03 (país por municipio) y W-04 (municipios de la entidad) necesitan coropléticos. RNF-01 limita la carga inicial a 500 KB y RNF-04 cada archivo de entidad a 300 KB. Una librería de mapas (Leaflet, MapLibre, D3-geo) pesa entre 40 y 200 KB y además requiere proyectar en el navegador o pedir teselas a un servicio externo. El marco geoestadístico INEGI (`00ent.shp`, `00mun.shp`) trae 2 478 municipios.

## Decisión

- El pipeline genera la geometría **ya proyectada** (Lambert conforme cónica, EPSG:6372, en metros) con mapshaper: `snap` para que los municipios vecinos compartan arcos, simplificación y salida **TopoJSON**.
- Se publican tres capas L4: `geo/entidades.topo.json`, `geo/<cve>.topo.json` y `geo/municipios.topo.json` (este último solo lo pide W-03).
- La app decodifica el TopoJSON con un módulo propio (`infrastructure/static-json/topology.ts`) y dibuja `<path>` en SVG. No hay librería de mapas ni proyección en el navegador.
- Color: escala secuencial de 7 pasos (`--rv-map-1..7`) con cortes por cuantiles (`domain/turnout/Scale.ts`); `--rv-map-empty` para sin dato o suprimido (RN-05).
- Los vecinos de cada municipio (W-04) se calculan en el pipeline a partir de los arcos compartidos del TopoJSON.

## Alternativas consideradas

- **Leaflet o MapLibre con teselas:** dependencia externa en tiempo de ejecución y peso adicional; contradice ADR-0001.
- **GeoJSON sin proyectar y D3-geo en el navegador:** archivos 3 a 4 veces más pesados y unos 30 KB de JS extra.
- **SVG estático pre-renderizado:** no permite colorear por año ni seleccionar municipios.

## Consecuencias

- Mapa nacional: 559 KB en disco y 152 KB con gzip. Excede el presupuesto de entidad, así que se agrega `mapa_nacional_kb = 650` a `budget.json` (pendiente de aprobación del equipo) y el archivo se descarga solo en W-03, nunca en la versión ligera.
- La app inicial queda en 398.3 KB de 500 KB.
- Cambiar la proyección o la simplificación es un cambio del pipeline, no de la app.
- Los mapas son decorativos para lectores de pantalla: la cifra siempre aparece en texto (RNF-07, RN-10).

## Actualización (18/10/2026)

Al adoptar el contrato de US-06, la geometría llega en **WGS84 (lon, lat)**, un TopoJSON por entidad (`geo/<slug>.topo.json`, áreas por CVEGEO) y `geo/entidades.topo.json`. La app la proyecta al dibujarla (equirrectangular con x · cos 23.5°, `infrastructure/static-json/topology.ts`) y sigue sin librería de mapas. No hay mapa municipal nacional: W-03 muestra las 32 entidades y, al tocar una, sus municipios. `mapa_nacional_kb` deja de usarse.
