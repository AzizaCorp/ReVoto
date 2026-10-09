# CLAUDE.md · ReVoto

@AGENTS.md

## Notas específicas de Claude Code

- Cada paquete tiene su `CLAUDE.md`, que importa su `AGENTS.md`; se cargan al trabajar en esa carpeta.
- Para componentes de UI usa el subagente `ui-atomico` o la skill `componente-atomico`.
- Para una funcionalidad que cruza capas (regla → caso de uso → datos → pantalla) usa la skill `flujo-ddd`.
- Antes de pedir revisión humana de un PR, puedes correr el subagente `revisor-dod`. Su resultado es una ayuda: **no sustituye la revisión par** que exige POL-REVISION-TRABAJO.
- Para wireframes usa la skill `wireframe-lofi`.
- El equipo trabaja en Windows 11: da comandos para PowerShell.
- Responde y documenta en español.
