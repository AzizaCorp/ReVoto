# Páginas (nivel "pages" de Atomic Design)

Aquí viven las pantallas `W-NN` de los wireframes. Son el **único** nivel de la UI que llama casos de uso de `application` (a través de hooks) y pasa el resultado a los componentes de `presentation/components`.

El esqueleto (US-09) ya monta todas las pantallas con su plantilla, la navegación y ranuras
`[corchetes]` / «—.— %» donde irán los datos. US-11 a US-14 reemplazan cada `Ranura` por el
componente real.

| Archivo | Wireframe | Plantilla | Prioridad |
| --- | --- | --- | --- |
| `W01Portada.tsx` | W-01 Portada | `PantallaNarrativa` (sin progreso) | Must |
| `W02Territorio.tsx` | W-02 Elige tu territorio | `PantallaUtilitaria` | Must |
| `W02bSobreTi.tsx` | W-02b Sobre ti (subpantalla del paso 2) | `PantallaUtilitaria` | Could |
| `W03MexicoVoto.tsx` | W-03 México votó | `PantallaNarrativa` | Must |
| `W04TuTerritorio.tsx` | W-04 Tu territorio | `PantallaNarrativa` | Must |
| `W05QuinceAnios.tsx` | W-05 Quince años de elecciones | `PantallaNarrativa` | Must |
| `W06TuGeneracion.tsx` | W-06 Tu generación | `PantallaNarrativa` | Must |
| `W07MujeresHombres.tsx` | W-07 Mujeres y hombres | `PantallaNarrativa` | Should |
| `W08TuLugar.tsx` | W-08 Tu lugar en tu entidad | `PantallaNarrativa` | Could |
| `W09Arquetipo.tsx` | W-09 El arquetipo de tu municipio | `PantallaNarrativa` | Should |
| `W09bInsignia.tsx` | W-09b Tu insignia (subpantalla del paso 9) | `PantallaNarrativa` | Could |
| `W09cMunicipioYYo.tsx` | W-09c Mi municipio y yo (subpantalla del paso 9) | `PantallaNarrativa` | Could |
| `W10Resumen.tsx` | W-10 Tu resumen (cierre) | `PantallaUtilitaria` | Must |
| `hojas/W11Fuente.tsx` | W-11 Ficha de fuente | `PlantillaHoja` | Must |
| `hojas/W12Compartir.tsx` | W-12 Crear tarjeta | `PlantillaHoja` | Must |
| `hojas/W13Ajustes.tsx` | W-13 Ajustes de lectura | `PlantillaHoja` | Must |
| `W15Ligera.tsx` | W-15 Versión ligera | `PantallaLigera` | Must |
| `W16DatosAbiertos.tsx` | W-16 Datos abiertos | `PantallaUtilitaria` | Should |
| `W17Estados.tsx` | W-17 Catálogo de estados (solo QA, `#/W-17`) | `PantallaUtilitaria` | — |

- `index.ts` registra cada vista en `PAGINAS` y cada hoja en `HOJAS`. El **orden** lo decide
  `domain/narrativa`; el registro solo dice qué componente dibuja cada id.
- `compartido/MarcoHistoria.tsx` une `PantallaNarrativa` con el motor: barras, progreso, chip de
  territorio, «Fuente», «Compartir» y ‹ ›.
- La URL refleja la vista (`#/W-03`), así funciona el botón «atrás» y se puede abrir una pantalla
  directo. Flechas ← → y deslizar cambian de pantalla (`hooks/useAtajosNavegacion`).
- Las respuestas de W-02b viven en memoria (`providers/Perfil.tsx`): no se guardan ni se envían.

W-14 (lector de pantalla) no es una página: es un comportamiento que cumplen todas. Los estados de W-17 se muestran dentro de cada página con el organismo `VistaEstado`; `W17Estados` solo los reúne para revisarlos.

Reglas:

- Una página no define estilos visuales propios: usa plantillas, organismos y tokens.
- Toda cifra es un `Cifra` del dominio y se muestra con `CifraConContexto` (RN-10).
- Los datos se piden con un caso de uso (`consultarParticipacion`) y el repositorio de `useDependencias()`; nunca con `fetch` ni importando `infrastructure`.
