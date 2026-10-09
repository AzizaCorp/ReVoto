---
name: componente-atomico
description: Procedimiento para crear un componente nuevo de ReVoto (apps/web/src/presentation/components) con Atomic Design. Úsalo cuando se pida un botón, chip, gráfica, barra, hoja, plantilla o cualquier pieza de UI.
---

# Crear un componente atómico en ReVoto

## 1. Decide el nivel

| Pregunta | Nivel |
| --- | --- |
| ¿Se puede dividir sin perder su función? No. | Átomo (`atoms/`) |
| ¿Combina átomos para una sola tarea? | Molécula (`molecules/`) |
| ¿Es una sección completa y reutilizable de pantalla? | Organismo (`organisms/`) |
| ¿Es un esqueleto de pantalla sin contenido real? | Plantilla (`templates/`) |
| ¿Es una pantalla W-NN con datos? | **No es un componente:** va en `presentation/pages` |
| ¿Es una regla de negocio o un cálculo? | **No es un componente:** va en `domain` (skill `flujo-ddd`) |

Consulta el inventario de `apps/web/src/presentation/components/README.md`; si el componente ya está planeado, usa ese nombre y nivel.

## 2. Genera la estructura

```powershell
npm run ui:nuevo -- <atomo|molecula|organismo|plantilla> NombreEnPascalCase
```

## 3. Implementa

- Props tipadas y exportadas (`export interface NombreProps`).
- Elementos nativos (`button`, `select`, `input`), `aria-*` solo cuando lo nativo no alcance.
- Estilos en `.module.css` con tokens `var(--rv-…)`. Sin valores literales.
- Objetivo táctil mínimo `var(--rv-objetivo-tactil)`; foco con `var(--rv-foco-anillo)`.
- Si muestra una cifra, recibe un `Cifra` del dominio y compón `CifraConContexto` (RN-10). Si muestra series, usa `rellenoSerie` (RN-03).
- Importa solo niveles inferiores y, si hace falta, tipos o funciones puras de `@/domain`. Nunca `application` ni `infrastructure`.

## 4. Prueba

- Render básico, nombre accesible y cada variante.
- `npm test -w @revoto/web`, `npm run lint`, `npm run typecheck`.

## 5. Documenta

- Comentario TSDoc con propósito, wireframe (`W-NN`) y requisito.
- Si el componente no estaba en el inventario, agrégalo a `presentation/components/README.md`.

## 6. Commit

`feat(web:US-NN): agrega <nivel> <Nombre>` en una rama `feat/US-NN-slug`.
