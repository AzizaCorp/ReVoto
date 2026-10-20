# presentation

Todo lo que tiene JSX. Usa el dominio y los casos de uso; recibe los adaptadores por `DependenciesProvider`.

| Carpeta | Contenido |
| --- | --- |
| `components/` | Atomic Design: átomos, moléculas, organismos y plantillas. Presentacionales: reciben datos por props. |
| `pages/` | Pantallas W-NN: eligen plantilla, llaman casos de uso vía hooks y pasan datos a los componentes. |
| `hooks/` | Envoltorios de casos de uso con estado de carga, error y aviso. |
| `providers/` | `DependenciesProvider` / `useDependencies`, `NavigationProvider` (motor de secuencia) y `ProfileProvider` (respuestas de W-02b). |
| `styles/` | Tokens de diseño y estilos globales. |
