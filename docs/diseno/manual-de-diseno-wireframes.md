# Manual de diseño · Wireframes de baja fidelidad · ReVoto

> **Versión:** 1.0 · **Fecha:** 05/10/2026 · **Historia:** US-04 · **Fuente de requisitos:** SRS ReVoto (secciones 5, 7 y 9)
> Este manual es la referencia obligatoria para crear o modificar cualquier wireframe del proyecto, a mano o con Claude Code (skill `wireframe-lofi`).

---

## 1. Propósito y alcance

Los wireframes de baja fidelidad (lo-fi) resuelven **estructura, jerarquía y flujo**, no estética. Sirven para:

1. Validar que cada historia **Must** tiene al menos una pantalla (US-04 · CA-2).
2. Probar el recorrido completo de portada a cierre antes de escribir código (US-04 · CA-1).
3. Fijar el layout **mobile-first a 360 px** que después se refinará en Figma (US-04 · CA-3, SRS 9.3).

**Fuera de alcance del lo-fi:** paleta de color definitiva, tipografía de marca, ilustración, logotipo (AP-01 aún abierto) y microanimaciones.

---

## 2. Principios

| # | Principio | Cómo se aplica en el wireframe |
| --- | --- | --- |
| P1 | **Una idea por pantalla** (HU-31) | Cada pantalla narrativa tiene una sola cifra protagonista y un solo mensaje. |
| P2 | **Ninguna cifra sola** (RN-10) | Toda cifra lleva, en la misma pantalla: territorio, periodo y control «Fuente». |
| P3 | **Mobile-first, 360 px** | Se dibuja primero a 360 × 760 px. 768 y 1024 se derivan después, nunca al revés. |
| P4 | **Pulgar primero** | Acciones principales en el tercio inferior; objetivos táctiles ≥ 44 × 44 px (WCAG 2.5.8). |
| P5 | **No solo color** (SRS 9.3) | El lo-fi es en escala de grises: si algo solo se distingue por color, el wireframe falla. |
| P6 | **Neutralidad** (RN-07, RNF-15) | Ningún texto de ejemplo alude a partidos, candidaturas ni juzga a un grupo. |
| P7 | **Cero datos personales** (RNF-13) | Ningún campo de captura de nombre, correo, teléfono, CURP o clave de elector. |
| P8 | **Todo estado existe** (SRS 9.3) | Cada vista con datos define carga, vacío y error. |

---

## 3. Lienzo y retícula

| Elemento | Valor |
| --- | --- |
| Marco base | **360 × 760 px** (viewport de referencia Motorola G82 en CSS px) |
| Márgenes laterales | 16 px |
| Retícula | 4 columnas, medianil 16 px, módulo base 8 px |
| Espaciado vertical | múltiplos de 8 (8, 16, 24, 32, 48) |
| Zona superior fija | 56 px (progreso + territorio + ajustes) |
| Zona inferior fija | 72 px (Fuente · Compartir · Avanzar) |
| Zona de contenido | 760 − 56 − 72 = **632 px** visibles sin desplazamiento |
| Puntos de quiebre posteriores | 768 px (marco centrado máx. 480 px) · 1024 px (marco + panel lateral de fuente) |

**Regla de oro:** en pantallas narrativas el contenido **no hace scroll** a 360 px en modo normal. En lectura fácil se permite scroll vertical.

---

## 4. Escala tipográfica lo-fi

Se usa una sola familia del sistema (`system-ui`). Lo que importa es el tamaño relativo.

| Token | Uso | Normal | Lectura fácil |
| --- | --- | --- | --- |
| `cifra` | Cifra protagonista | 56 px / 700 | 64 px |
| `h1` | Mensaje principal | 24 px / 700 | 28 px |
| `h2` | Subtítulo, encabezado de hoja | 18 px / 600 | 22 px |
| `cuerpo` | Texto de apoyo | 16 px / 400 | **20 px** (mín. SRS 9.3) |
| `meta` | Territorio · periodo · nota | 14 px / 400 | 18 px |
| `etiqueta` | Etiquetas de gráfica, chips | 13 px / 500 | 16 px |

En el lo-fi el texto corrido se representa con **barras grises** (`.wf-lines`); los textos clave (mensaje, cifra, botones, etiquetas) se escriben reales para validar el lenguaje claro (RNF-18).

---

## 5. Paleta lo-fi (solo grises)

| Token | Hex | Uso |
| --- | --- | --- |
| `--ink` | `#1a1a1a` | Texto, bordes fuertes, botón primario |
| `--ink-2` | `#555` | Texto secundario |
| `--line` | `#9a9a9a` | Bordes de componentes |
| `--fill` | `#d9d9d9` | Marcadores de imagen / gráfica |
| `--fill-2` | `#efefef` | Fondos de tarjeta / hoja |
| `--paper` | `#ffffff` | Fondo del marco |
| `--note` | `#ffe14d` | **Solo** para anotaciones del diseñador (no forma parte de la UI) |

Distinción de series sin color: **sólido vs. rayado** (presidencial vs. intermedia, RN-03), y etiquetas de valor siempre visibles.

---

## 6. Catálogo de componentes lo-fi

Todos están implementados en `design/wireframes/lofi.css`. Usa estas clases; no inventes estilos sueltos.

| Componente | Clase | Reglas |
| --- | --- | --- |
| Marco de pantalla | `.wf-frame` | 360 × 760, contiene `.wf-top`, `.wf-body`, `.wf-bottom` |
| Barra de progreso | `.wf-progress` > `span` (`.on`) | 10 segmentos = 10 pantallas de la secuencia (RF-03) |
| Chip de territorio | `.wf-chip` | Muestra «Entidad · Municipio ▾»; abre W-02. «Nacional» si no se eligió |
| Botón primario | `.wf-btn.primary` | Uno por pantalla como máximo. Alto 48 px |
| Botón secundario | `.wf-btn` | Contorno. Alto 44–48 px |
| Botón de texto / icono | `.wf-link`, `.wf-icon` | Icono siempre con etiqueta visible o `aria-label` anotado |
| Cifra protagonista | `.wf-figure` | Cifra + `.wf-meta` inmediatamente debajo (territorio · periodo) |
| Líneas de texto | `.wf-lines` > `i` | Representan párrafos; anchura variable |
| Marcador de imagen/gráfica | `.wf-ph` | Caja gris con aspa; texto describe qué irá |
| Gráfica de barras lo-fi | `.wf-bars` | Barra = `div` con `--v` (0–100) y etiqueta de valor |
| Serie temporal lo-fi | `.wf-series` | Columnas sólidas (presidencial) y rayadas (intermedia) |
| Selector | `.wf-select` | Etiqueta visible arriba, caja con ▾ |
| Hoja inferior (bottom sheet) | `.wf-sheet` | Para Fuente, Ajustes y Compartir. Con asa, título y «Cerrar» |
| Aviso / nota | `.wf-alert` | Para RN-05 (umbral), ALT-01 (error), periodos faltantes |
| Interruptor | `.wf-toggle` | Lectura fácil, movimiento reducido, versión ligera |
| Esqueleto de carga | `.wf-skel` | Estado de carga |
| Anotación | `.wf-pin` (número en el marco) + lista `.wf-notes` | Explica comportamiento, reglas y accesibilidad |

---

## 7. Plantillas de pantalla

### 7.1 Pantalla narrativa (RIU-03) — la más usada

```
┌──────────────── 360 ────────────────┐
│ ▬▬▬▬▬▭▭▭▭▭  (progreso 10 seg.)      │  wf-top · 56 px
│ [Jalisco · Guadalajara ▾]      [Aa] │
├─────────────────────────────────────┤
│ Mensaje principal en una línea      │  h1
│                                     │
│            59.7 %                   │  cifra
│   Nacional · Elección federal 2024  │  meta (territorio · periodo)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       visualización             │ │  wf-ph / wf-bars / wf-series
│ └─────────────────────────────────┘ │
│ ▭▭▭▭▭▭▭▭▭▭▭▭▭▭ (texto de apoyo)     │  wf-lines
├─────────────────────────────────────┤
│ [ⓘ Fuente] [↗ Compartir]   [‹] [›]  │  wf-bottom · 72 px
└─────────────────────────────────────┘
```

Elementos obligatorios: progreso, chip de territorio, ajustes (Aa), mensaje, cifra, meta, visualización con valores, Fuente, Compartir (si la pantalla es compartible), anterior/siguiente.

### 7.2 Hoja inferior (RIU-06, RIU-07, RIU-10)

Ocupa ~70 % del alto, fondo atenuado, asa superior, título `h2`, contenido, botón «Cerrar» (y Escape). El foco entra a la hoja y regresa al control que la abrió.

### 7.3 Pantallas utilitarias (Selector, Resumen, Datos abiertos)

Desplazamiento vertical permitido. Encabezado con «‹ Volver» y título; acción principal fija abajo.

---

## 8. Patrones de interacción

| Patrón | Regla | Requisito |
| --- | --- | --- |
| Avanzar / retroceder | Botones ‹ ›, deslizar horizontal, tocar mitad derecha/izquierda, flechas ← → | RF-02 |
| Progreso | Segmento activo relleno; texto oculto «Pantalla 4 de 10» | RF-03, HU-14 |
| Cambiar territorio | El chip abre W-02 desde cualquier pantalla y regresa a la misma | HU-28 |
| Fuente | Botón «ⓘ Fuente» siempre en la zona inferior de pantallas con cifra | RF-12, RN-10 |
| Compartir | Abre W-12; ofrece 9:16 / 1:1 y menú nativo si existe | RF-15 |
| Resumen | Desde cualquier pantalla vía menú «Aa»/«Ver resumen»; es también la pantalla de cierre | RF-04 |
| Sin avance automático | Nunca hay temporizador en el MVP; en lectura fácil se garantiza explícitamente | HU-10 |

---

## 9. Accesibilidad que debe anotarse en cada wireframe

Cada pantalla debe llevar, en su lista de anotaciones, al menos:

1. **Orden de foco** (números `F1, F2…` cuando no sea el orden visual obvio).
2. **Texto alternativo** de la visualización, redactado completo con cifra, territorio y periodo (RF-17).
3. **Región viva** (`aria-live`) cuando cambia el contenido (HU-14 · CA-03).
4. **Alternativa en tabla** para series y barras (RIU-04).
5. **Objetivos táctiles** ≥ 44 px y contraste esperado (≥ 4.5:1 texto, ≥ 3:1 gráficos).

---

## 10. Nomenclatura y trazabilidad

- ID de wireframe: `W-NN` (dos dígitos). Pantallas de la secuencia: `W-01` a `W-10`. Auxiliares: `W-11` en adelante.
- Encabezado de cada marco: `W-NN · Nombre · RIU-xx · HU-xx [Prioridad]`.
- Archivo: todas las pantallas viven en `design/wireframes/index.html`; si un archivo supera ~1 500 líneas, dividir por épica (`e01-recorrido.html`, …).
- Toda nueva pantalla se agrega a la **matriz de trazabilidad** de `docs/diseno/arquitectura-informacion.md` §5.

---

## 11. Lista de verificación (DoD del wireframe)

- [ ] Marco de 360 px de ancho (`.wf-frame`), sin desbordamiento horizontal.
- [ ] Encabezado con ID, RIU, HU y prioridad.
- [ ] Toda cifra con territorio, periodo y Fuente (RN-10).
- [ ] Un solo botón primario.
- [ ] Series con distinción intermedia/presidencial sin depender del color (RN-03).
- [ ] Estados de carga, vacío y error definidos o referenciados a W-17.
- [ ] Anotaciones de accesibilidad (§9).
- [ ] Ningún campo de dato personal; ningún texto partidista.
- [ ] Pantalla enlazada en el mapa de navegación y en la matriz de trazabilidad.

---

## Control de cambios

| # | Autor | Cambio | Fecha |
| --- | --- | --- | --- |
| 1 | Angel (con Claude) | Creación inicial para US-04 | 05/10/2026 |
