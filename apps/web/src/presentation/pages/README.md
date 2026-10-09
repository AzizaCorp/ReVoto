# Páginas (nivel "pages" de Atomic Design)

Aquí viven las pantallas `W-NN` de los wireframes. Son el **único** nivel de la UI que llama casos de uso de `application` (a través de hooks) y pasa el resultado a los componentes de `presentation/components`.

**Todavía no hay ninguna.** Se crean en US-09 (motor de secuencia) y US-11 (pantallas de cifras).

| Archivo previsto | Wireframe | Plantilla | Prioridad |
| --- | --- | --- | --- |
| `W01Portada.tsx` | W-01 Portada | `PantallaUtilitaria` | Must |
| `W02Territorio.tsx` | W-02 Elige tu territorio | `PantallaUtilitaria` | Must |
| `W03MexicoVoto.tsx` | W-03 México votó | `PantallaNarrativa` | Must |
| `W04TuTerritorio.tsx` | W-04 Tu territorio | `PantallaNarrativa` | Must |
| `W05QuinceAnios.tsx` | W-05 Quince años de elecciones | `PantallaNarrativa` | Must |
| `W06TuGeneracion.tsx` | W-06 Tu generación | `PantallaNarrativa` | Must |
| `W07MujeresHombres.tsx` | W-07 Mujeres y hombres | `PantallaNarrativa` | Should |
| `W08UrbanoRural.tsx` | W-08 Urbano, rural, mixto | `PantallaNarrativa` | Could |
| `W09Arquetipo.tsx` | W-09 El arquetipo de tu zona | `PantallaNarrativa` | Should |
| `W10Resumen.tsx` | W-10 Tu resumen (cierre) | `PantallaUtilitaria` | Must |
| `hojas/W11Fuente.tsx` | W-11 Ficha de fuente | `PlantillaHoja` | Must |
| `hojas/W12Tarjeta.tsx` | W-12 Crear tarjeta | `PlantillaHoja` | Must |
| `hojas/W13Ajustes.tsx` | W-13 Ajustes de lectura | `PlantillaHoja` | Must |
| `W15Ligera.tsx` | W-15 Versión ligera | `PantallaLigera` | Must |
| `W16DatosAbiertos.tsx` | W-16 Datos abiertos | `PantallaUtilitaria` | Should |

W-14 (lector de pantalla) y W-17 (estados) no son páginas: son comportamientos que cumplen todas las páginas y el organismo `VistaEstado`. El orden de W-01 a W-10 lo define `domain/narrativa`.

Reglas:

- Una página no define estilos visuales propios: usa plantillas, organismos y tokens.
- Toda cifra es un `Cifra` del dominio y se muestra con `CifraConContexto` (RN-10).
- Los datos se piden con un caso de uso (`consultarParticipacion`) y el repositorio de `useDependencias()`; nunca con `fetch` ni importando `infrastructure`.
