# AGENTS.md · Contexto del proyecto ReVoto

Este archivo es el punto de partida para cualquier agente de IA (Claude Code, Codex, Cursor, Copilot) y para cualquier persona nueva en el repositorio. Léelo completo antes de cambiar algo. Cada paquete tiene su propio `AGENTS.md` con reglas específicas.

## Qué es ReVoto

Micrositio de *storytelling* con datos de **participación electoral federal en México (2009–2024)** para el **Hackathon INE 2026**. Es una secuencia de pantallas tipo *stories* (la portada y 12 pantallas; el número sale de `domain/narrative`), mobile-first, que muestra cuánto vota el territorio del usuario, cómo cambió en el tiempo y cómo varía por edad y sexo.

- **Entrega:** 31/10/2026. **Equipo:** Angel (Architecture owner, Program manager) y Kira (Team leader, QA). Ambos son Product owner.
- **Organización:** MIWA. Los procesos siguen CMMI-DEV v1.3 adaptado a un equipo de dos personas.
- **Más contexto:** `docs/contexto/` (producto, reglas de negocio, requisitos, glosario, convenciones).

## Reglas no negociables

Si una tarea entra en conflicto con alguna, detente y pregunta.

| Regla | Qué significa en el código | Origen |
| --- | --- | --- |
| Sitio estático, sin backend | Nada de servidores, bases de datos ni funciones en producción. Todo dato se precalcula en `apps/pipeline`. | RNF-17, ADR-0001 |
| Cero datos personales | Ningún campo que pida nombre, correo, teléfono, CURP o clave de elector. Sin cookies de rastreo. | RNF-12, RNF-13 |
| Participación = SV / (LN − NS) | Los registros sin dato se excluyen del denominador; no son abstención. | RN-01 |
| Solo nacional, entidad y municipio | La sección electoral nunca sale del pipeline. | RN-02 |
| Grupos de edad fijos | 18–24, 25–34, 35–44, 45–59, 60+. La edad simple no se publica. | RN-04 |
| Umbral de publicación | Un municipio bajo el umbral se marca `suprimido` y la UI muestra la entidad con una nota. | RN-05 |
| Ninguna cifra sola | Toda cifra lleva territorio, periodo y fuente en la misma pantalla. | RN-10 |
| Intermedias ≠ presidenciales | Se distinguen por relleno (rayado vs. sólido) y etiqueta, nunca solo por color. | RN-03 |
| Neutralidad política total | Ningún texto alude a partidos o candidaturas ni juzga a un grupo. | RN-07, RNF-15 |
| Accesibilidad WCAG 2.2 AA | Foco visible, objetivos ≥ 44 px, contraste ≥ 4.5:1, texto alternativo y tabla alternativa para cada gráfica. | RNF-07, RNF-08 |
| Peso | Carga inicial ≤ 500 KB; cada archivo de entidad ≤ 300 KB. | RNF-01, RNF-04 |
| Español claro | Todo texto visible en español de México, sin tecnicismos sin explicar. | RNF-18 |

## Arquitectura en 30 segundos

```text
L0/L1 fuentes (bucket, fuera de Git)
   └─► apps/pipeline (Python + DuckDB, fuera de línea)
          └─► apps/web/public/data/ (JSON que cumplen packages/contracts)
                 └─► apps/web (React + Vite, DDD) ─► Vercel CDN ─► navegador
```

Detalle: `docs/diseno/DIS-REVOTO-ARQUITECTURA-DESPLIEGUE-v0.4.md` y `docs/adr/0003-ddd-en-la-app-web.md`.

## Monorepo

| Ruta | Paquete | Qué contiene | Contexto |
| --- | --- | --- | --- |
| `apps/web/` | `@revoto/web` | El micrositio, organizado con **DDD**. | `apps/web/AGENTS.md` |
| `apps/pipeline/` | (Python) | SQL de DuckDB, validación RF-23, exportación L4. | `apps/pipeline/AGENTS.md` |
| `packages/contracts/` | `@revoto/contracts` | Contrato L4: tipos DTO + JSON Schema que comparten web y pipeline. | `packages/contracts/AGENTS.md` |
| `docs/` | — | Contexto, diseño, historias, estándares de MIWA, ADR. | — |
| `design/wireframes/` | — | Wireframes lo-fi W-01 a W-17 (fuente de verdad de la UI). | `docs/diseno/manual-de-diseno-wireframes.md` |

## Capas de `apps/web/src` (DDD)

| Capa | Qué va aquí | Depende de |
| --- | --- | --- |
| `domain/` | Reglas puras: `election` (RN-03), `territory` (RN-02), `turnout` (RN-01, RN-04, `Figure` RN-10, escala del mapa), `identity` (arquetipo, insignia), `narrative/Sequence` (RF-01–03), `quality` | Nada |
| `application/` | Casos de uso (`use-cases/`: `getTurnout`, `getTerritoryStory`, `compareTerritory`, `municipalityInsights`…) y puertos (`ports/`: `TurnoutRepository`, `GeographyRepository`, `QualityRepository`, `OpenDataRepository`) | `domain` |
| `infrastructure/` | Adaptadores en `static-json/`: leer JSON del CDN (`JsonClient`), traducir DTO → dominio (`mappers.ts`) y TopoJSON (`topology.ts`) | `domain`, `application`, `@revoto/contracts` |
| `presentation/` | React: `pages/` (W-NN), `components/` con **Atomic Design**, hooks, estilos | `domain`, `application` |
| `main.tsx` | Punto de composición: crea adaptadores y los inyecta | Todo |

Las dependencias siempre apuntan hacia `domain`. ESLint bloquea cualquier import que rompa esta tabla y las fronteras de Atomic Design.

**¿Dónde pongo esto?** Una regla de negocio → `domain`. Un flujo («si el municipio está suprimido, mostrar la entidad») → caso de uso en `application`. Leer o escribir datos → adaptador en `infrastructure` detrás de un puerto. Cualquier cosa con JSX → `presentation`.

## Comandos

```powershell
npm install                       # instala el monorepo (Node 22)
npm run dev                       # app en http://localhost:5173
npm run check                     # lint + tipos + pruebas + build + peso + contrato de datos
npm run ui:nuevo -- atomo Boton   # crea un componente de Atomic Design
npm run pipeline:test             # pruebas del pipeline (Python)
cd apps/pipeline; python -m revoto_pipeline   # corrida completa del pipeline
```

Antes de dar por terminada cualquier tarea de código, `npm run check` debe pasar.

## Cómo trabajar en este repo

1. **Ramas** (`docs/gestion-configuracion/STD-ESTRATEGIA-RAMAS-v0.3.md`): `develop` → Development, `staging` → Staging, `main` → Production. Trabaja en `feat/US-NN-slug`, `fix/DEF-NN-slug`, `data/…`, `docs/…`, `chore/…` desde `develop`. Nunca hagas push directo a una rama permanente.
2. **Commits** (`STD-MENSAJES-COMMIT-v0.3.md`): `<tipo>(<componente>:<ID>): <descripción>`, en español y en presente. Componentes: `web`, `contracts`, `pipeline`, `docs`, `infra`. Ejemplo: `feat(web:US-09): agrega átomo Boton`. commitlint lo valida.
3. **PR:** usa la plantilla. La aprobación la da la otra persona del equipo; un agente nunca aprueba ni fusiona.
4. **Definition of Done:** D1 a D7 de `STD-READY-DONE` (ver plantilla de PR).

## Lo que un agente NO debe hacer

- Romper la regla de dependencias de DDD (por ejemplo, importar `infrastructure` desde una página o React desde `domain`).
- Crear pantallas fuera de `presentation/pages` o componentes fuera de los niveles de `presentation/components`.
- Usar los DTO de `@revoto/contracts` fuera de `infrastructure`.
- Editar a mano `apps/web/public/data/`: lo genera el pipeline.
- Agregar backend, base de datos, analítica con rastreo o dependencias pesadas sin una decisión registrada en `docs/adr/`.
- Escribir valores visuales literales: usa los tokens de `apps/web/src/presentation/styles/tokens.css`.
- Inventar cifras. En ejemplos y pruebas usa datos sintéticos marcados como tales.
- Guardar secretos, credenciales o datos crudos en el repositorio.
- Hacer `push`, `merge`, `rebase` o `force push` sobre `develop`, `staging` o `main`.

## Agentes y skills disponibles (Claude Code)

| Nombre | Tipo | Para qué |
| --- | --- | --- |
| `ui-atomico` | Subagente | Crear o modificar componentes de `presentation/components` respetando Atomic Design y los wireframes. |
| `pipeline-datos` | Subagente | Trabajar en el pipeline DuckDB y el contrato L4. |
| `revisor-dod` | Subagente | Revisar un cambio contra el DoD, las reglas del producto y los estándares de MIWA antes de pedir revisión humana. |
| `auditor-accesibilidad` | Subagente | Auditar componentes y páginas contra WCAG 2.2 AA. |
| `componente-atomico` | Skill | Procedimiento paso a paso para crear un componente. |
| `flujo-ddd` | Skill | Agregar una funcionalidad atravesando las capas: dominio → caso de uso → puerto → adaptador → página. |
| `wireframe-lofi` | Skill | Crear o modificar wireframes lo-fi en `design/wireframes/`. |

Definiciones en `.claude/agents/` y `.claude/skills/`.

## Mapa de documentación

| Necesito… | Archivo |
| --- | --- |
| Entender el producto y sus pantallas | `docs/contexto/producto.md`, `docs/diseno/arquitectura-informacion.md` |
| Reglas de negocio completas | `docs/contexto/reglas-negocio.md` |
| Umbrales técnicos (peso, tiempos, accesibilidad) | `docs/contexto/requisitos-clave.md` |
| Términos del dominio electoral | `docs/contexto/glosario.md` |
| Ramas, commits, PR y DoD | `docs/contexto/convenciones.md` |
| Diseño de la UI | `docs/diseno/manual-de-diseno-wireframes.md`, `design/wireframes/index.html` |
| Arquitectura y despliegue | `docs/diseno/DIS-REVOTO-ARQUITECTURA-DESPLIEGUE-v0.4.md` |
| Capas DDD y por qué | `docs/adr/0003-ddd-en-la-app-web.md` |
| Decisiones de arquitectura | `docs/adr/` |
| Historias de usuario | `docs/historias/README.md` |
