# ADR-0002 · Monorepo con npm workspaces, React + TypeScript y Atomic Design

- **Estado:** Reemplazada parcialmente por [ADR-0003](./0003-ddd-en-la-app-web.md) (se conservan npm workspaces, React + TypeScript y Atomic Design; cambia la organización en paquetes)
- **Fecha:** 08/10/2026
- **Decisores:** Angel (Architecture owner), Kira

## Contexto

El producto tiene una app, un sistema de diseño reutilizable, un contrato de datos compartido con el pipeline y el propio pipeline. Los wireframes ya definen un catálogo de componentes (manual §6) que se repite en 17 pantallas.

## Decisión

- **Monorepo con npm workspaces:** `apps/web`, `packages/ui`, `packages/data` y `pipeline/` (Python, fuera de los workspaces). npm viene con Node: nada extra que instalar en las laptops con Windows.
- **React 19 + TypeScript + Vite:** el equipo y los agentes lo conocen; su runtime cabe en el presupuesto de 500 KB.
- **Atomic Design en `packages/ui`:** tokens → átomos → moléculas → organismos → plantillas; las páginas viven en la app. Las fronteras se hacen cumplir con ESLint.
- **CSS Modules + variables CSS** para estilos, sin librería de estilos en tiempo de ejecución.

## Consecuencias

- Un solo PR puede cambiar contrato, pipeline y UI de forma consistente.
- El runtime de React (~60 KB gzip con react-dom) consume parte del presupuesto de RNF-01; `check:budget` lo vigila en cada PR.
- npm workspaces es menos estricto que pnpm con dependencias no declaradas: cada paquete debe declarar las suyas.
