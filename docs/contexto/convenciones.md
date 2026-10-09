# Convenciones de trabajo

> Resumen operativo. Los documentos normativos completos están en `docs/gestion-configuracion/`.

## Ramas (STD-ESTRATEGIA-RAMAS v0.3)

| Rama | Entorno | Se integra desde |
| --- | --- | --- |
| `develop` | Development | Ramas de trabajo (squash) |
| `staging` | Staging (URL fija, QA y stakeholders) | `develop` (merge), `fix/*` durante congelamiento |
| `main` | Production | `staging` (merge + tag `vX.Y.Z`), `hotfix/*` |

Ramas de trabajo: `<tipo>/<ID>-<slug>` en minúsculas y con guion medio. Tipos: `feat`, `fix`, `docs`, `data`, `chore`, `hotfix`. Ejemplos: `feat/US-09-motor-secuencia`, `fix/DEF-04-contraste-boton`, `data/US-06-marts-2024`.

Reglas clave: sin push directo a ramas permanentes; 1 aprobación de quien no es autor; back-merge en menos de 24 h; tags inmutables.

## Commits (STD-MENSAJES-COMMIT v0.3)

```text
<tipo>(<componente>:<ID>)[!]: <descripción en presente, minúscula, sin punto>

[cuerpo: qué y por qué]

[pies: Closes: DEF-NN · Refs: US-NN · BREAKING CHANGE: …]
```

- Tipos: `feat`, `fix`, `data`, `perf`, `refactor`, `style`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.
- Componentes de este repo: `web`, `contracts`, `pipeline`, `docs`, `infra`.
- Encabezado ≤ 72 caracteres. `fix` lleva `Closes: DEF-NN`. `data` lleva fuente, cobertura y validación.

## Pull requests

- Título con el mismo formato que un commit; usa la plantilla.
- Evidencia: preview, capturas a 360 px, resultado de `npm run check`.
- Checks obligatorios: `web`, `pipeline`, `commits`, `secretos`.

## Definition of Done (STD-READY-DONE)

D1 entregable terminado · D2 todos los CA cumplidos · D3 revisado por la otra persona · D4 versionado y accesible · D5 sin no conformidades críticas · D6 PVG actualizado · D7 sin datos personales ni credenciales.

## Versionamiento

- Código: SemVer. `0.Y.0` por sprint, `1.0.0` en la entrega, `-rc.N` en staging.
- Documentos: `MAYOR.MENOR` (STD-VERSIONAMIENTO); nombre de archivo = Código CM.
