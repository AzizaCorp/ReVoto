# Páginas (nivel "pages" de Atomic Design)

Aquí viven las pantallas `W-NN` de los wireframes. Son el **único** nivel de la UI que llama casos de uso de `application` (a través de hooks) y pasa el resultado a los componentes de `presentation/components`.

El esqueleto (US-09) ya monta todas las pantallas con su plantilla, la navegación y ranuras
`[corchetes]` / «—.— %» donde irán los datos. US-11 a US-14 reemplazan cada `Slot` por el
componente real.

Los nombres de archivos y componentes están en inglés; los textos que ve la persona usuaria, en español.

| Archivo                       | Wireframe                                        | Plantilla                        | Prioridad |
| ----------------------------- | ------------------------------------------------ | -------------------------------- | --------- |
| `W01Cover.tsx`                | W-01 Portada                                     | `NarrativeScreen` (sin progreso) | Must      |
| `W02Territory.tsx`            | W-02 Elige tu territorio                         | `UtilityScreen`                  | Must      |
| `W02bAboutYou.tsx`            | W-02b Sobre ti (subpantalla del paso 2)          | `UtilityScreen`                  | Could     |
| `W03MexicoVoted.tsx`          | W-03 México votó                                 | `NarrativeScreen`                | Must      |
| `W04YourTerritory.tsx`        | W-04 Tu territorio                               | `NarrativeScreen`                | Must      |
| `W05FifteenYears.tsx`         | W-05 Quince años de elecciones                   | `NarrativeScreen`                | Must      |
| `W06YourGeneration.tsx`       | W-06 Tu generación                               | `NarrativeScreen`                | Must      |
| `W07WomenAndMen.tsx`          | W-07 Mujeres y hombres                           | `NarrativeScreen`                | Should    |
| `W08YourPlace.tsx`            | W-08 Tu lugar en tu entidad                      | `NarrativeScreen`                | Could     |
| `W09Archetype.tsx`            | W-09 El arquetipo de tu municipio                | `NarrativeScreen`                | Should    |
| `W09bBadge.tsx`               | W-09b Tu insignia (subpantalla del paso 9)       | `NarrativeScreen`                | Could     |
| `W09cMyMunicipalityAndMe.tsx` | W-09c Mi municipio y yo (subpantalla del paso 9) | `NarrativeScreen`                | Could     |
| `W10Summary.tsx`              | W-10 Tu resumen (cierre)                         | `NarrativeScreen`                | Must      |
| `sheets/W11Source.tsx`        | W-11 Ficha de fuente                             | `SheetTemplate`                  | Must      |
| `sheets/W12Share.tsx`         | W-12 Crear tarjeta                               | `SheetTemplate`                  | Must      |
| `sheets/W13Settings.tsx`      | W-13 Ajustes de lectura                          | `SheetTemplate`                  | Must      |
| `W15Lite.tsx`                 | W-15 Versión ligera                              | `LiteScreen`                     | Must      |
| `W16OpenData.tsx`             | W-16 Datos abiertos                              | `UtilityScreen`                  | Should    |
| `W17States.tsx`               | W-17 Catálogo de estados (solo QA, `#/W-17`)     | `UtilityScreen`                  | —         |
| `W18Methodology.tsx`          | W-18 Metodología                                 | `UtilityScreen` (`sidebar`)      | Should    |
| `W19Dictionary.tsx`           | W-19 Diccionario de datos                        | `UtilityScreen`                  | Should    |
| `sheets/W20Quality.tsx`       | W-20 Reporte de calidad y validación             | `SheetTemplate`                  | Should    |

- `index.ts` registra cada vista en `PAGES` y cada hoja en `SHEETS`. El **orden** lo decide
  `domain/narrative`; el registro solo dice qué componente dibuja cada id.
- `shared/StoryFrame.tsx` une `NarrativeScreen` con el motor: barras, progreso, chip de
  territorio, «Fuente», «Compartir» y ‹ ›.
- La URL refleja la vista (`#/W-03`), así funciona el botón «atrás» y se puede abrir una pantalla
  directo. Flechas ← → y deslizar cambian de pantalla (`hooks/useNavigationShortcuts`).
- Las respuestas de W-02b viven en memoria (`providers/Profile.tsx`): no se guardan ni se envían.

W-14 (lector de pantalla) no es una página: es un comportamiento que cumplen todas. Los estados de W-17 se muestran dentro de cada página con el organismo `StatusView`; `W17Estados` solo los reúne para revisarlos.

Reglas:

- Una página no define estilos visuales propios: usa plantillas, organismos y tokens.
- Toda cifra es un `Figure` del dominio y se muestra con `FigureWithContext` (RN-10).
- Los datos se piden con un caso de uso (`getTurnout`) y el repositorio de `useDependencies()`; nunca con `fetch` ni importando `infrastructure`.
