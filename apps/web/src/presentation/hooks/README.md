# hooks

Hooks de React que conectan las páginas con los casos de uso de `application`, por ejemplo
`useTurnout(territory)` → `getTurnout(repo, territory)` con estados de carga, error y aviso de
umbral (W-17). Se crean en US-09 y US-11.

- `useNavigationShortcuts` · flechas ← → y deslizamiento horizontal para cambiar de pantalla (RF-02).
  Un deslizamiento cuenta solo si mide 80 px o más, se desvía menos de unos 27° de la horizontal
  y dura menos de 600 ms. Se ignora si empieza en los 24 px de las orillas (gesto «atrás» del
  teléfono), sobre un mapa o control con gestos propios (`data-gesture`, sliders), dentro de un
  elemento con scroll horizontal, con texto seleccionado o con dos dedos (DEF-30, DEF-31).
