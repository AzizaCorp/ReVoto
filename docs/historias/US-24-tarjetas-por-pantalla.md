# US-24 · Compartir cada pantalla como tarjeta tipo «historias»

| Campo | Valor |
| --- | --- |
| **Épica** | [E-04 Diseño y piezas compartibles](https://app.notion.com/p/3efa4b89591481e2aed4d580dd039ef6) |
| **Prioridad (MoSCoW)** | Should |
| **Story Points** | 3 |
| **Sprint** | Sprint 4 (24-31 oct) |
| **Responsable** | Angel |
| **Revisor (D3)** | Kira |
| **Fecha compromiso** | 27/10/2026 |
| **Estado** | In progress |
| **Ficha en Notion** | [User Story Backlog · US-24](https://app.notion.com/p/403a4b89591481d2bda4d5c83940a5d2) |

## 🎯 Objetivo

> **Como** persona que recorre ReVoto,
> **quiero** compartir cualquier pantalla de mi recorrido como una tarjeta al estilo del resumen anual de Spotify,
> **para** publicar en mis historias o redes el dato que más me sorprendió.

## 🔗 Trazabilidad

| Artefacto | Referencia |
| --- | --- |
| SRS | SRS-01 · HU-02 → RF-15 · RN-03, RN-08, RN-10 |
| Pantallas / interfaz | W-03 a W-10 · W-12 Compartir |
| Rama de GitHub | `feat/US-24-resumen-historias-compartibles` (desde `develop`) |
| Pull request | [liga] |
| Depende de | [US-14 Generar y descargar la tarjeta compartible](./US-14-tarjeta-compartible.md) |
| Prácticas CMMI-DEV v1.3 | RD SP 2.1 · TS SP 2.1 · VER SP 3.1 |

## ✅ Criterios de aceptación

| # | Criterio | Verificación / evidencia | Resultado |
| --- | --- | --- | --- |
| CA-01 | **Dada** cualquier pantalla de W-03 a W-10, **cuando** se toque «Compartir», **entonces** W-12 abre con la tarjeta de esa pantalla. | `W12Share.test.tsx` · «a card for every story screen» | ✅ |
| CA-02 | **Dada** la tarjeta de una pantalla, **cuando** se elija el formato, **entonces** se exporta en 9:16 (1080 × 1920) y 1:1 (1080 × 1080). | PNG exportados en Chromium; prueba de nombres de archivo | ✅ |
| CA-03 | **Dada** una tarjeta, **cuando** se exporte, **entonces** muestra territorio, periodo y fuente y no incluye datos personales. | `slideCards.test.ts` · `SlideCard.test.tsx` | ✅ |
| CA-04 | **Dada** una pantalla sin datos suficientes, **cuando** se abra W-12, **entonces** explica qué falta en lugar de generar una tarjeta vacía. | `W12Share.test.tsx` · W-08 sin municipio | ✅ |

## 🧭 Tarjetas por pantalla

| Pantalla | Cifra grande | Barras |
| --- | --- | --- |
| W-03 México votó | Participación nacional 2024 | Serie nacional 2009–2024 |
| W-04 Tu territorio | Participación de tu territorio 2024 | Territorio, entidad y México |
| W-05 Quince años | Diferencia presidenciales vs. intermedias | Serie 2009–2024 del territorio |
| W-06 Tu generación | Brecha 18–24 vs. 60 + | Participación por grupo de edad |
| W-07 Mujeres y hombres | Diferencia por sexo | Mujeres y hombres |
| W-08 Tu lugar | Lugar en la entidad | Los 3 primeros y tu municipio |
| W-09 · W-09b · W-09c | Arquetipo, insignia y «Mi municipio y yo» (tarjetas de US-14) | — |
| W-10 Tu resumen | Participación de tu territorio 2024 | Las cifras clave del recorrido |

- Cada pantalla tiene su paleta («wrapped»): `SLIDE_THEMES` en `components/organisms/IdentityCard/slideThemes.ts`.
- RN-03: las barras de intermedias van rayadas y su etiqueta dice «int.»; las presidenciales, lisas y «pres.».
- En W-03 a W-10 la hoja W-12 no muestra «Qué compartes»: indica «Esta pantalla · [nombre]» y solo deja elegir el formato. Las opciones «Mi arquetipo», «Mi insignia» y «Los dos» aparecen solo en W-09, W-09b y W-09c.
- Los botones de compartir llaman la atención con un efecto «cromado» (`Button chroma`): un borde degradado que gira, un destello y un brillo que se reproducen 2 s después de cambiar de pantalla, para no competir con la lectura de la pantalla (`--rv-chroma-delay`). Con «Reducir movimiento», «Lectura fácil» o `prefers-reduced-motion` no se anima: queda solo el borde de color.

  | Variante | Colores (paleta del diseño) | Dónde |
  | --- | --- | --- |
  | `fucsia` | #ff2d94 · #ff8cc6 · #ffd23f · #c8106e · #933d82 | «Compartir» de la barra superior y de la barra inferior en W-03 a W-08 |
  | `aurora` | #7b45d6 · #4b5fe0 · #c6f432 · #ff8cc6 | «Compartir mi arquetipo» (W-09) y «Compartir los dos» (W-09c) |
  | `oro` | #ffd23f · #ff8a00 · #ff2d94 · #fff3d6 | «Compartir mi insignia» (W-09b) y «Compartir mi resumen» (W-10) |

- La tarjeta 1:1 conserva la cifra, la frase, el territorio y la fuente; muestra las barras solo cuando son 3 o menos.
- El contenido sale de `pages/shared/slideCards.ts` (función pura y probada) y se dibuja con `SlideCard`.

## 📋 Definition of Done

- [x] D1 · Entregable existe y está terminado
- [x] D2 · Todos los CA se cumplen
- [ ] D3 · Revisado por Kira (PR)
- [x] D4 · Versionado y accesible
- [x] D5 · Sin no conformidades críticas abiertas
- [ ] D6 · PVG actualizado (Toggl, fecha real)
- [x] D7 · Sin datos personales ni credenciales

---

| # | Autor | Modificación | Fecha |
| --- | --- | --- | --- |
| 1 | Angel | Creación de la historia | 23/10/2026 |
