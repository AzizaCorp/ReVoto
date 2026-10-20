# ADR-0006 · Exportación de tarjetas con html-to-image en carga diferida

- **Estado:** Propuesta
- **Fecha:** 18/10/2026
- **Decisores:** Angel (Architecture owner)

## Contexto

US-14 pide descargar tarjetas PNG de 1080 × 1920 y 1080 × 1080 con datos reales. Generar la imagen en un servidor contradice ADR-0001, y dibujar cada tarjeta a mano en `<canvas>` duplicaría el diseño que ya existe como componentes HTML/CSS.

## Decisión

- La tarjeta es el mismo componente React que se ve en pantalla (360 px de ancho) y se exporta con `html-to-image` a `pixelRatio: 3`.
- La librería se importa con `import()` solo al pulsar «Descargar» (`presentation/share/exportCard.ts`), así que no entra en la carga inicial.
- Las fuentes se incrustan como CSS antes de exportar para que el PNG salga igual en cualquier dispositivo; la altura se ajusta a 1920 o 1080 exactos.

## Alternativas consideradas

- **Servicio de imágenes (Vercel OG, Cloud Run):** agrega servidor (RNF-17).
- **Canvas a mano:** doble mantenimiento del diseño.
- **Captura con `dom-to-image` o `html2canvas`:** más pesadas o con peor soporte de fuentes.

## Consecuencias

- Carga inicial sin cambio (398.3 KB de 500 KB); el chunk de exportación se descarga una sola vez.
- La exportación depende del navegador: se prueba en Motorola G82 y iPhone en US-17.
- Las tarjetas no contienen datos personales (RN-08): solo territorio, cifra, periodo y fuente.
