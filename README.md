# ReVoto

Micrositio de *storytelling* con datos de participación electoral federal en México (2009–2024). Hackathon INE 2026 · MIWA.

> Datos: INE · Conteos Censales de Participación Ciudadana (CCPC). No pedimos datos personales.

## Qué hace

ReVoto cuenta en una secuencia de pantallas cuánto vota tu municipio frente a tu entidad y al país. Eliges tu territorio (o sigues con cifras nacionales), respondes de forma opcional unas preguntas sobre ti y recorres las cifras como una historia. Cada pantalla con cifras se puede compartir como tarjeta tipo «historias» (9:16) o publicación (1:1), y al final puedes descargar los datos abiertos.

La secuencia tiene 13 pantallas: la portada y 12 pasos. El contador «Pantalla N de 12» y la barra de progreso se calculan a partir de la secuencia (decisión D-04 en `docs/diseno/arquitectura-informacion.md`).

| # | Pantalla | Contenido |
| --- | --- | --- |
| — | W-01 Portada | Promesa, periodo 2009–2024 y entrada a la historia |
| 1 | W-02 Elige tu territorio | Entidad y municipio, o «Usar cifras nacionales» |
| 2 | W-02b Sobre ti | Cuatro preguntas opcionales (edad y si votaste en 2018, 2021 y 2024); no salen del dispositivo |
| 3 | W-03 México votó | Participación nacional 2024 y mapa por entidad |
| 4 | W-04 Tu territorio | Tu municipio frente a tu entidad y al país |
| 5 | W-05 Quince años de elecciones | Serie 2009–2024, intermedias y presidenciales |
| 6 | W-06 Tu generación | Participación por grupo de edad |
| 7 | W-07 Mujeres y hombres | Participación por sexo |
| 8 | W-08 Tu lugar en tu entidad | Tu municipio entre los de tu entidad |
| 9 | W-09 El arquetipo de tu municipio | Patrón de participación en el tiempo |
| 10 | W-09b Tu insignia | Insignia según tus respuestas |
| 11 | W-09c Mi municipio y yo | Tus respuestas junto a las cifras de tu municipio |
| 12 | W-10 Tu resumen | Cifras clave, compartir, datos abiertos y volver a empezar |

Fuera de la secuencia:

- **Hojas inferiores:** W-11 Fuente, W-12 Compartir (la tarjeta de cada pantalla, el arquetipo o la insignia, en 9:16 o 1:1; US-24), W-13 Ajustes de lectura y W-20 Reporte de calidad y validación.
- **Pantallas de consulta:** W-15 Versión ligera, W-16 Datos abiertos, W-17 Estados, W-18 Metodología y W-19 Diccionario de datos.

Accesibilidad (RNF-07): cada gráfica tiene «Ver como tabla», hay lectura fácil, tamaño de texto (A- / A / A+), movimiento reducido y una versión ligera de solo texto y tablas. La navegación funciona con botones, teclado (← →) y deslizamiento horizontal. Cada pantalla tiene una dirección legible (`/inicio`, `/elige-tu-territorio`, `/tu-territorio`…), que se puede compartir o abrir directo.

## Requisitos

- Node.js 22 (`.nvmrc`) y npm 10+
- Python 3.12+ (solo para el pipeline de datos)
- Git configurado con finales de línea LF (`.gitattributes` ya lo fuerza)

## Primeros pasos (PowerShell)

```powershell
npm install          # instala el monorepo y activa el hook de commits
npm run dev          # http://localhost:5173
npm run check        # lint + tipos + pruebas + build + peso + contrato de datos
```

Pipeline de datos (detalle en `apps/pipeline/README.md`):

```powershell
cd apps/pipeline
python -m venv .venv; .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest -q
```

## Estructura

```text
revoto/
├─ apps/
│  ├─ web/                       # @revoto/web · React + Vite · DDD
│  │  ├─ index.html              # metadatos e íconos de la pestaña
│  │  ├─ public/
│  │  │  ├─ data/                # JSON L4 generados por el pipeline
│  │  │  └─ revoto-isotipo.svg   # favicon (+ favicon-32.png, apple-touch-icon.png)
│  │  └─ src/
│  │     ├─ domain/              # reglas de negocio puras (RN-01…RN-10) y secuencia
│  │     ├─ application/         # casos de uso + puertos
│  │     ├─ infrastructure/
│  │     │  ├─ static-json/      # repositorios que leen public/data
│  │     │  └─ open-data/        # descargas CSV/JSON generadas en el build
│  │     ├─ presentation/        # React
│  │     │  ├─ components/       # Atomic Design: atoms · molecules · organisms · templates
│  │     │  ├─ pages/            # pantallas W-NN, hojas (sheets/), versión ligera (lite/)
│  │     │  ├─ providers/        # navegación, datos de la historia, respuestas, dependencias
│  │     │  ├─ hooks/            # atajos de teclado, gestos y media queries
│  │     │  └─ styles/           # tokens y estilos globales
│  │     └─ main.tsx             # punto de composición
│  └─ pipeline/                  # Python + DuckDB · L1 → L4
├─ packages/
│  └─ contracts/                 # @revoto/contracts · contrato L4 (tipos + JSON Schema)
├─ design/
│  ├─ alta-fidelidad/svg/        # logos (horizontal e isotipo), ilustración y mapas
│  ├─ tarjetas/                  # diseño de las tarjetas para compartir
│  └─ wireframes/                # wireframes lo-fi (línea base de US-04)
├─ docs/
│  ├─ adr/                       # decisiones de arquitectura 0001–0006
│  ├─ contexto/                  # producto, reglas de negocio, requisitos, glosario, convenciones
│  ├─ diseno/                    # arquitectura y despliegue, arquitectura de información, manual de wireframes
│  ├─ gestion-configuracion/     # estándares de ramas y de commits de MIWA
│  └─ historias/                 # historias de usuario US-01 a US-23
├─ scripts/                      # generador de componentes y checks de CI
├─ .claude/                      # subagentes y skills para Claude Code
├─ .github/                      # CI y plantilla de PR
├─ budget.json                   # presupuestos de peso (RNF-01, RNF-04)
├─ vercel.json                   # Vercel Services: servicio «web» + encabezados
└─ AGENTS.md · CLAUDE.md         # contexto para agentes (léelo primero)
```

La razón de esta estructura y la regla de dependencias entre capas están en `docs/adr/0003-ddd-en-la-app-web.md`.

## Datos

- **Fuente:** INE · Conteos Censales de Participación Ciudadana (CCPC), elecciones federales 2009, 2012, 2015, 2018, 2021 y 2024. Fórmula de participación: votaron ÷ (lista nominal − sin dato).
- **Copia publicada:** `apps/web/public/data/` (país, 32 entidades y municipios), validada contra el contrato L4 de `packages/contracts` con `npm run check:data`.
- **Descargas abiertas:** el build genera en `dist/data/descargas/` tres tablas planas, cada una en CSV (RFC 4180, UTF-8 con BOM) y JSON: `participacion`, `participacion_edad_sexo` y `arquetipos_municipales`. En `npm run dev` se sirven desde memoria. Viven bajo `data/`, así que no cuentan en el presupuesto de la app.
- **Fuente, metodología y diccionario:** los textos de W-11, W-18, W-19 y W-20 salen de `apps/web/src/presentation/pages/shared/dataSource.ts`, alineado con el diccionario de datos D06 (US-07).

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de la app |
| `npm run build` | Build de producción en `apps/web/dist` (incluye las descargas abiertas) |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | ESLint, incluidas las capas DDD y las fronteras de Atomic Design |
| `npm run format` / `format:check` | Prettier: aplica o verifica el formato |
| `npm run typecheck` | TypeScript en todos los paquetes |
| `npm test` | Vitest en todos los paquetes |
| `npm run check:budget` | Peso de la carga inicial (≤ 500 KB gzip) y de los JSON (RNF-01, RNF-04) |
| `npm run check:data` | Valida `apps/web/public/data` contra el contrato L4 |
| `npm run ui:nuevo -- <nivel> <Nombre>` | Crea un componente de Atomic Design |
| `npm run pipeline:test` | Pruebas del pipeline (Python) |
| `npm run check` | Lint, tipos, pruebas, build, peso y contrato de datos |

La CI (`.github/workflows/ci.yml`) corre en cada PR: web (lint, formato, tipos, pruebas, build, peso y contrato), pipeline (pytest), commits (commitlint del título y de cada commit) y secretos (gitleaks).

## Cómo contribuir

Según `docs/gestion-configuracion/STD-ESTRATEGIA-RAMAS-v0.3.md` y `STD-MENSAJES-COMMIT-v0.3.md`:

1. **Rama** desde `develop`: `<prefijo>/<ID>-<slug>`, con prefijo `feat/`, `fix/`, `docs/`, `data/`, `chore/` o `hotfix/` (por ejemplo, `feat/US-12-api-participacion-entidad` o `fix/DEF-04-contraste-boton`).
2. **Commits:** `<tipo>(<componente>:<ID>): <descripción>` en inglés, de 72 caracteres como máximo (por ejemplo, `fix(web:DEF-27): derive screen count and progress from the sequence`). Los pies ligan el trabajo: `Closes: DEF-NN` y `Refs: TSK-NN`. El hook de husky los valida con commitlint.
3. **PR a `develop`** con la plantilla de `.github/pull_request_template.md`; lo aprueba la otra persona del equipo.
4. **Promoción:** `develop` → `staging` (`chore(release): vX.Y.Z-rc.N`) → `main` (`chore(release): vX.Y.Z`).

## Despliegue

Vercel con **Services** (`vercel.json` en la raíz, Root Directory = raíz del repo): un solo servicio público, `web` (`apps/web`). El pipeline no se despliega: corre fuera de línea. `develop` → Development, `staging` → Staging, `main` → Production. Las rutas `/data/` llevan caché corta (las versiones `AAAAMMDD-hash` son inmutables), y todo el sitio lleva HSTS y CSP. Detalle en `docs/diseno/DIS-REVOTO-ARQUITECTURA-DESPLIEGUE-v0.4.md`.

## Licencia

MIT. Ver `LICENSE`.
