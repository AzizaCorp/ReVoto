# apps/web · Contexto para agentes

App React 19 + TypeScript + Vite, publicada como sitio estático en Vercel y organizada con **DDD**. Lee `docs/adr/0003-ddd-en-la-app-web.md` antes de crear carpetas o mover código.

## Estructura

```text
src/
├─ domain/                 # reglas puras (sin React, sin fetch)
│  ├─ eleccion/            # AnioEleccion, tipoDeEleccion (RN-03)
│  ├─ territorio/          # Territorio, NACIONAL, territorioSuperior (RN-02, RN-05)
│  ├─ participacion/       # Proporcion, calcularParticipacion (RN-01), GrupoEdad (RN-04), Cifra (RN-10), SerieParticipacion
│  └─ narrativa/           # Secuencia W-01…W-10 (+ subpantallas W-02b, W-09b, W-09c), progreso por paso
├─ application/            # casos de uso y puertos
│  ├─ ports/               # ParticipacionRepository
│  ├─ casos-uso/           # consultarParticipacion (CU-02, RN-05), listarEntidades, listarMunicipios
│  └─ errores.ts           # DatosNoDisponibles (W-17)
├─ infrastructure/         # adaptadores de los puertos
│  └─ json-estatico/       # ClienteJson (manifiesto + caché), mapeadores DTO → dominio, JsonParticipacionRepository
├─ presentation/           # todo lo que tiene JSX
│  ├─ components/          # Atomic Design: atoms · molecules · organisms · templates
│  ├─ pages/               # nivel "pages": pantallas W-NN (registro en pages/index.ts)
│  ├─ hooks/               # conectan páginas con casos de uso
│  ├─ providers/           # ProveedorDependencias, ProveedorNavegacion (motor), ProveedorPerfil
│  ├─ styles/              # tokens.css, tokens.ts, global.css
│  └─ App.tsx
└─ main.tsx                # punto de composición: crea adaptadores y los inyecta
```

Alias de importación: `@/` = `src/` (`@/domain`, `@/application`, `@/presentation/components`).

## Regla de dependencias (la hace cumplir ESLint)

| Desde | Puede importar | Nunca |
| --- | --- | --- |
| `domain` | otros módulos de `domain` | React, `fetch`, `application`, `infrastructure`, `presentation`, `@revoto/contracts` |
| `application` | `domain` | React, `fetch`, `infrastructure`, `presentation`, `@revoto/contracts` |
| `infrastructure` | `domain`, `application`, `@revoto/contracts` | React, `presentation` |
| `presentation/pages`, `hooks`, `providers` | `domain`, `application`, `presentation/components` | `infrastructure`, `@revoto/contracts`, `fetch` |
| `presentation/components` | `domain` (solo tipos y funciones puras), niveles atómicos inferiores, `styles` | `application`, `pages`, `providers`, `infrastructure` |
| `main.tsx` | todo | — |

## Reglas

- **Una regla de negocio nueva va primero al dominio**, con su prueba (`*.test.ts`), y después se usa desde la UI.
- **Toda cifra en pantalla es un `Cifra` del dominio** (trae territorio, elección y fuente: RN-10). Los componentes reciben `Cifra`, no números sueltos.
- **Las páginas no hacen `fetch`:** llaman a un caso de uso con el repositorio de `useDependencias()`.
- **Los DTO del contrato se traducen en `infrastructure/json-estatico/mapeadores.ts`** y nunca salen de ahí.
- Cada pantalla define carga, error con reintento (`DatosNoDisponibles`) y aviso de umbral (`aviso: 'umbral-rn05'`) (W-17).
- Al cambiar de pantalla, anuncia `progreso(secuencia, id).texto` en `aria-live="polite"` (HU-14). Sin avance automático (HU-10).
- Ajustes de lectura como atributos en `<html>`: `data-lectura="facil"`, `data-movimiento="reducido"`.
- Presupuesto: carga inicial (sin `public/data`) ≤ 500 KB gzip (`npm run check:budget`).

## Vercel

Este paquete es el servicio `web` del `vercel.json` de la raíz (Vercel Services; Root Directory = raíz del repo). **Production Branch** = `main`, dominio de Staging asignado a la rama `staging`. El `vercel.json` de la raíz define caché de datos y encabezados de seguridad (RNF-11); no crees otro aquí. Prueba local con `vercel dev` desde la raíz.
