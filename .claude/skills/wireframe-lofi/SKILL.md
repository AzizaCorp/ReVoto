---
name: wireframe-lofi
description: Crea o modifica wireframes de baja fidelidad de ReVoto (mobile-first 360 px) siguiendo el manual de diseño del proyecto. Úsala cuando se pida un wireframe, una pantalla nueva, un cambio de layout o revisar la cobertura de historias en los wireframes.
---

# Wireframes lo-fi · ReVoto

## Antes de dibujar

1. Lee `docs/diseno/manual-de-diseno-wireframes.md` completo (principios, retícula, componentes, DoD).
2. Lee `docs/diseno/arquitectura-informacion.md` (inventario de pantallas, mapa de navegación y matriz de trazabilidad).
3. Identifica la historia (HU-xx), el componente de interfaz (RIU-xx) y la prioridad MoSCoW en el SRS. Si la historia no existe en el SRS, pregunta antes de inventarla.

## Cómo construir una pantalla

1. Abre `design/wireframes/index.html`. Copia la `<article class="wf-card">` más parecida (narrativa, hoja inferior o utilitaria).
2. Asigna el siguiente ID libre `W-NN` y rellena el encabezado: `W-NN · Nombre · RIU-xx · HU-xx [Must|Should|Could]`.
3. Usa **solo** clases de `design/wireframes/lofi.css`. Si falta un componente, agrégalo a `lofi.css` y al catálogo del manual (§6), no como estilo en línea.
4. Respeta las reglas no negociables:
   - Marco `.wf-frame` de 360 × 760 px; nada desborda en horizontal.
   - Toda cifra con territorio + periodo + botón «Fuente» (RN-10).
   - Elecciones intermedias rayadas, presidenciales sólidas (RN-03).
   - Grupos de edad solo 18–24, 25–34, 35–44, 45–59, 60+ (RN-04).
   - Sin campos de datos personales (RNF-13) y sin alusiones partidistas (RN-07, RNF-15).
   - Sin avance automático.
5. Añade pines `.wf-pin` numerados y su lista `.wf-notes` con: comportamiento, regla de negocio aplicada, texto alternativo completo, orden de foco y región viva.
6. Si la pantalla cambia la navegación, actualiza el diagrama Mermaid en `docs/diseno/arquitectura-informacion.md` §3 **y** el de la pestaña «Mapa de flujo» de `index.html`.
7. Agrega la fila a la matriz de trazabilidad (§5 de arquitectura-informacion.md).

## Verificación

- Abre `index.html` en el navegador con el viewport a 360 px y confirma que no hay scroll horizontal.
- Recorre la lista DoD del manual (§11) y marca cada punto en tu respuesta.
- Confirma que cada historia Must del SRS sigue teniendo al menos una pantalla en la matriz.
