# Tarjetas descargables · ReVoto

- `png/`: PNG listos para redes, con ranuras de ejemplo ([Municipio], —.—): 5 arquetipos (A1–A5) y 6 insignias (I1–I6), cada uno en 9:16 (1080 × 1920) y 1:1 (1080 × 1080).
- `png/mi-municipio-y-yo/`: las 30 combinaciones «Mi municipio y yo» (6 insignias × 5 arquetipos), cada una con su titular cruzado, en 9:16 y 1:1 (60 PNG). Nombre: `revoto-p9-{insignia}{arquetipo}-…`. Si el municipio es «Historial corto» o la persona no respondió, se comparte solo la tarjeta A o I.
- `tarjetas.html`: herramienta autocontenida (fuentes, logos y librería incluidas, funciona sin internet). Escribe los datos reales sobre la tarjeta y descarga el PNG a 1080 px; botón para descargar las 24.
- Para la app: cada tarjeta es un bloque HTML/CSS de 360 px que se exporta con `pixelRatio: 3` (html-to-image), el mismo método que usa la herramienta.
- Fuentes (OFL): Plus Jakarta Sans, Sora, Fraunces, Bricolage Grotesque, Unbounded, Anton y DM Serif Display.
