# ReVoto

Micrositio de *storytelling* con datos de participación electoral federal en México (2009–2024). Hackathon INE 2026 · MIWA.

> Nombre provisional. Datos: conteos censales del INE. No pedimos datos personales.

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

Pipeline de datos:

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
│  │  ├─ src/
│  │  │  ├─ domain/              # reglas de negocio puras (RN-01…RN-10)
│  │  │  ├─ application/         # casos de uso + puertos
│  │  │  ├─ infrastructure/      # adaptadores (JSON del CDN)
│  │  │  ├─ presentation/        # React
│  │  │  │  ├─ components/       # Atomic Design: atoms · molecules · organisms · templates
│  │  │  │  ├─ pages/            # pantallas W-NN
│  │  │  │  └─ styles/           # tokens
│  │  │  └─ main.tsx             # punto de composición
│  │  └─ public/data/            # JSON generados por el pipeline
│  └─ pipeline/                  # Python + DuckDB · L1 → L4
├─ packages/
│  └─ contracts/                 # @revoto/contracts · contrato L4 (tipos + JSON Schema)
├─ docs/                         # contexto, ADR, diseño, historias, estándares de MIWA
├─ design/wireframes/            # wireframes lo-fi W-01 a W-17
├─ scripts/                      # generador de componentes y checks de CI
├─ .claude/                      # subagentes y skills para Claude Code
├─ .github/                      # CI y plantilla de PR
├─ vercel.json                  # Vercel Services: servicio «web» + encabezados
└─ AGENTS.md · CLAUDE.md         # contexto para agentes (léelo primero)
```

La razón de esta estructura y la regla de dependencias entre capas están en `docs/adr/0003-ddd-en-la-app-web.md`.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de la app |
| `npm run build` | Build de producción en `apps/web/dist` |
| `npm run lint` | ESLint, incluidas las capas DDD y las fronteras de Atomic Design |
| `npm run typecheck` | TypeScript en todos los paquetes |
| `npm test` | Vitest en todos los paquetes |
| `npm run check:budget` | Peso de la carga inicial y de los JSON (RNF-01, RNF-04) |
| `npm run check:data` | Valida `apps/web/public/data` contra el contrato L4 |
| `npm run ui:nuevo -- <nivel> <Nombre>` | Crea un componente de Atomic Design |
| `npm run pipeline:test` | Pruebas del pipeline (Python) |
| `npm run check` | Lint, tipos, pruebas, build, peso y contrato de datos |

## Cómo contribuir

1. Rama desde `develop`: `feat/US-NN-slug` (ver `docs/contexto/convenciones.md`).
2. Commits: `feat(web:US-09): agrega átomo Boton` (commitlint los valida).
3. PR a `develop` con la plantilla; lo aprueba la otra persona del equipo.

## Despliegue

Vercel con **Services** (`vercel.json` en la raíz, Root Directory = raíz del repo): un solo servicio público, `web` (`apps/web`). El pipeline no se despliega: corre fuera de línea. `develop` → Development, `staging` → Staging, `main` → Production. Detalle en `docs/diseno/DIS-REVOTO-ARQUITECTURA-DESPLIEGUE-v0.3.md`.
