# 📐 Estándar de Mensajes de Commit

## 🪪 Ficha de Configuración

| Campo | Valor |
| --- | --- |
| **Código CM** | `STD-MENSAJES-COMMIT-v0.1` |
| **Prefijo** | `STD` |
| **Nombre del Documento (Slug)** | `MENSAJES-COMMIT` |
| **Versión** | `0.1` |
| **Estado del documento** | Borrador |
| **Nivel de control (POL CM)** | 🟡 Work in Progress |
| **Confidencialidad** | 🟡 Interna |
| **Propietario** | Angel (Architecture owner) |
| **Aprobador** | CCB |
| **Línea base** | No incorporado |
| **Repositorio oficial** | GitHub · `docs/gestion-configuracion/` · copia en Notion |

---

## 🎯 Propósito

Este estándar define el formato obligatorio de los mensajes de commit y de los títulos de pull request en los repositorios de MIWA, con base en **Conventional Commits 1.0.0**.

Hace falta por tres razones concretas:

- **Trazabilidad.** Cada cambio en el código o en los datos publicados debe poder rastrearse hasta la historia de usuario o el defecto que lo originó, para cumplir la identificación y el registro de cambios que pide `POL-GESTION-CONFIGURACION`.
- **Versionamiento predecible.** El tipo de commit determina qué parte de la versión SemVer se incrementa en cada release, como exige `STD-ESTRATEGIA-RAMAS`.
- **Revisión eficiente.** Un historial uniforme permite al revisor par entender qué cambió y por qué sin abrir cada archivo, y permite generar las notas de versión automáticamente.

En CMMI-DEV v1.3 soporta **CM SP 2.1 (Rastrear solicitudes de cambio)**, **CM SP 3.1 (Establecer registros de gestión de configuración)** y **GP 2.6 (Controlar productos de trabajo)**.

---

## 🔍 Alcance

- **Aplica a:** Angel y Kira, y cualquier colaborador futuro que haga commits en un repositorio de MIWA. Cubre todos los commits que llegan al remoto, los títulos de pull request y los commits de fusión generados en las promociones.
- **No aplica a:** Commits locales que se reescriben antes de subirse (por ejemplo, con `git commit --amend` o un `rebase` interactivo en una rama propia que aún no está en el remoto).
- **Ámbito geográfico/organizacional:** Toda la organización MIWA.

---

## 📖 Definiciones y Terminología

| Término | Definición |
| --- | --- |
| **Commit** | Registro inmutable de un cambio en el repositorio Git, identificado por un hash. |
| **Encabezado (header)** | Primera línea del mensaje: `<tipo>(<alcance>): <descripción>`. |
| **Tipo** | Palabra controlada que clasifica la naturaleza del cambio (ver especificación 2). |
| **Alcance (scope)** | Identificador entre paréntesis que liga el commit a una historia de usuario, un defecto u otra categoría permitida (ver especificación 3). |
| **Descripción** | Resumen breve del cambio, después de los dos puntos. |
| **Cuerpo (body)** | Texto libre, separado del encabezado por una línea en blanco, que explica qué cambió y por qué. |
| **Pie (footer)** | Líneas `Clave: valor` al final del mensaje, con referencias y metadatos. |
| **Cambio incompatible (breaking change)** | Cambio que rompe un contrato existente, por ejemplo el esquema de los artefactos de datos o una URL pública. Se marca con `!` y con el pie `BREAKING CHANGE:`. |
| **Commit atómico** | Commit que contiene un solo cambio lógico y deja el proyecto en un estado que compila. |
| **commitlint** | Herramienta que valida automáticamente los mensajes contra este estándar. |

---

## 👥 Roles y Responsabilidades

| Rol | Responsabilidad |
| --- | --- |
| **Dueño del estándar** | Angel. Mantener, actualizar y difundir el estándar y la configuración de commitlint. |
| **Aplicador** | Angel y Kira. Redactar cada commit y cada título de PR conforme a este estándar. |
| **Revisor/Auditor** | Revisor par del PR (siempre distinto del autor). Rechazar el PR si el título o los commits no cumplen, y verificar el cumplimiento en el corte semanal. |
| **Quien fusiona el PR** | Confirmar que el mensaje del commit resultante (squash o merge) cumple el formato antes de fusionar. |

---

## 📏 Especificaciones del Estándar

1. **Estructura del mensaje.** Todo mensaje sigue esta estructura:

   ```text
   <tipo>(<alcance>)[!]: <descripción>

   [cuerpo]

   [pie(s)]
   ```

   El encabezado es obligatorio. El cuerpo y los pies son obligatorios en los casos que indica la especificación 6.

2. **Tipos permitidos.** Solo se aceptan estos valores, en minúsculas:

| Tipo | Uso | Efecto en SemVer |
| --- | --- | --- |
| `feat` | Funcionalidad nueva visible para el usuario | MINOR |
| `fix` | Corrección de un defecto | PATCH |
| `data` | Alta o regeneración de artefactos de datos L3/L4 (JSON, CSV) | PATCH (MINOR si agrega un indicador nuevo) |
| `perf` | Mejora de rendimiento o de peso de carga sin cambiar el comportamiento | PATCH |
| `refactor` | Reestructuración de código sin cambiar el comportamiento | — |
| `style` | Formato, espacios o punto y coma; sin cambio de lógica ni de estilos visuales | — |
| `test` | Pruebas nuevas o corregidas | — |
| `docs` | Documentación versionada en el repositorio | — |
| `build` | Sistema de construcción o dependencias | — |
| `ci` | Configuración de integración o despliegue continuo | — |
| `chore` | Mantenimiento que no encaja en los anteriores, incluidas las promociones | — |
| `revert` | Reversión de un commit previo | Según lo revertido |

   `data` es una extensión propia de MIWA, permitida por Conventional Commits, para separar los cambios en cifras publicadas de los cambios de código (RN-10, RF-23).

3. **Alcance obligatorio.** El alcance siempre se indica y debe ser uno de estos valores:

| Alcance | Cuándo |
| --- | --- |
| `US-NN` | El cambio implementa o modifica una historia de usuario. Ej. `US-09`. |
| `DEF-NN` | El cambio corrige un defecto registrado en la bitácora. Ej. `DEF-04`. |
| `release` | Commits de promoción y back-merge entre ramas permanentes. |
| `deps` | Actualización de dependencias sin historia asociada. |

   El alcance va en mayúsculas para `US` y `DEF`, igual que en el backlog y en la bitácora, para que la búsqueda sea directa (`git log --grep "(US-09)"`).

4. **Descripción.**
   - En **español**, con el verbo en presente y en tercera persona, como si completara la frase "Este commit…": *agrega*, *corrige*, *elimina*, *actualiza*.
   - Inicia con minúscula y no termina en punto.
   - Describe el resultado, no la actividad: "agrega selector de municipio", no "trabajé en el selector".
   - El encabezado completo no excede **72 caracteres**.

5. **Cuerpo.**
   - Se separa del encabezado con una línea en blanco.
   - Explica **qué** cambió y **por qué**; el **cómo** ya está en el diff.
   - Ninguna línea excede **100 caracteres**.

6. **Cuerpo y pies obligatorios.**

| Caso | Contenido mínimo obligatorio |
| --- | --- |
| `fix` | Causa del defecto y pie `Closes: DEF-NN`. |
| `data` | Fuente, periodo y territorio de los datos (RN-10), y resultado de la validación contra cifras oficiales (RF-23) o referencia a su reporte. |
| Cambio incompatible | `!` después del alcance y pie `BREAKING CHANGE: <qué se rompe y cómo migrar>`. |
| `revert` | Pie `Reverts: <hash>` y motivo de la reversión en el cuerpo. |
| Trabajo en pareja | Pie `Co-authored-by: Nombre <correo>` por cada coautor. |

7. **Pies permitidos.** Se usan con el formato `Clave: valor`, uno por línea:
   - `Refs: US-NN` — referencia adicional a otra historia.
   - `Closes: DEF-NN` — el commit cierra el defecto.
   - `BREAKING CHANGE: <descripción>` — cambio incompatible.
   - `Reverts: <hash>` — commit revertido.
   - `Co-authored-by: Nombre <correo>` — coautoría.

8. **Commits atómicos.** Cada commit contiene un solo cambio lógico y deja el proyecto compilando. No se mezclan, por ejemplo, un `feat` y un `refactor` ajeno en el mismo commit.

9. **Título de PR.** El título de todo PR cumple la especificación 1, porque al hacer *squash and merge* se convierte en el encabezado del commit que queda en la rama permanente.

10. **Commits de promoción.** Los PR entre ramas permanentes, definidos en `STD-ESTRATEGIA-RAMAS`, usan estos títulos:
    - `chore(release): vX.Y.Z-rc.N` — `develop` → `staging`.
    - `chore(release): vX.Y.Z` — `staging` → `main`.
    - `chore(release): back-merge vX.Y.Z a develop` — integración de vuelta.

11. **Contenido prohibido.** Ningún mensaje contiene credenciales, tokens, datos personales, lenguaje ofensivo ni opiniones políticas o partidistas (RNF-13, RN-07). Tampoco se aceptan mensajes genéricos: `cambios`, `wip`, `fix`, `update`, `asdf`, `.`.

12. **Validación automática.** El repositorio incluye commitlint con la configuración de referencia de este estándar. Se ejecuta en local (hook `commit-msg`) y como check obligatorio en cada PR.

> 💡 **Ejemplos de cumplimiento**
>
> ```text
> feat(US-09): agrega navegación por gestos entre pantallas
> ```
>
> ```text
> fix(DEF-04): corrige contraste del botón primario
>
> El texto blanco sobre #4FA3A5 daba 2.9:1 y WCAG 2.2 AA exige 4.5:1.
> Se oscurece el fondo a #2F6F71 (5.8:1).
>
> Closes: DEF-04
> ```
>
> ```text
> data(US-06): regenera participación por grupo de edad 2024
>
> Fuente: Conteos censales INE (DECEYEC), elección federal 2024.
> Territorio: nacional, 32 entidades y municipios sobre el umbral RN-05.
> Validación: diferencia máxima 0.3 pp contra cifras oficiales (RF-23).
> ```
>
> ```text
> feat(US-11)!: cambia el esquema de marts a un archivo por entidad
>
> BREAKING CHANGE: participacion.json se divide en participacion/<cve_ent>.json;
> los componentes deben pedir el archivo de la entidad seleccionada.
> ```

> 🚫 **Ejemplos de no cumplimiento**
>
> | Mensaje | Incumple |
> | --- | --- |
> | `cambios en el selector` | Sin tipo ni alcance (1, 2, 3) |
> | `feat: agrega selector` | Sin alcance (3) |
> | `Feat(us-09): Agregué el selector.` | Tipo en mayúscula, alcance en minúscula, verbo en pasado, mayúscula inicial y punto final (2, 3, 4) |
> | `fix(DEF-04): arregla bug` | Sin cuerpo ni pie `Closes` (6) y descripción genérica (4) |
> | `data(US-06): actualiza datos` | Sin fuente, periodo ni validación (6) |

### Configuración de referencia de commitlint

```js
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'scope-miwa': ({ scope }) => [
          /^(US-\d{2}|DEF-\d{2,3}|release|deps)$/.test(scope ?? ''),
          'el alcance debe ser US-NN, DEF-NN, release o deps',
        ],
      },
    },
  ],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'data', 'perf', 'refactor', 'style',
      'test', 'docs', 'build', 'ci', 'chore', 'revert',
    ]],
    'scope-empty': [2, 'never'],
    'scope-case': [0],
    'scope-miwa': [2, 'always'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'subject-full-stop': [2, 'never', '.'],
  },
};
```

> commitlint valida las especificaciones 1 a 5. Los pies obligatorios de la especificación 6 (`Closes`, fuente y validación en `data`) se verifican en la revisión par del PR.

```mermaid
flowchart TD
    A["Tengo un cambio listo"] --> B{"¿Agrega algo nuevo<br/>visible para el usuario?"}
    B -- Sí --> FEAT["feat"]
    B -- No --> C{"¿Corrige un defecto?"}
    C -- Sí --> FIX["fix + Closes: DEF-NN"]
    C -- No --> D{"¿Cambia cifras o<br/>artefactos L3/L4?"}
    D -- Sí --> DATA["data + fuente, periodo y validación"]
    D -- No --> E{"¿Cambia código sin<br/>cambiar comportamiento?"}
    E -- "Más rápido o ligero" --> PERF["perf"]
    E -- "Reestructura" --> REF["refactor"]
    E -- "Solo formato" --> STY["style"]
    E -- No --> F{"¿Qué toca?"}
    F -- Pruebas --> TEST["test"]
    F -- Documentación --> DOCS["docs"]
    F -- "Dependencias o build" --> BUILD["build"]
    F -- "CI / despliegue" --> CI["ci"]
    F -- "Promoción o mantenimiento" --> CHORE["chore"]
    FEAT --> G{"¿Rompe un contrato existente?"}
    FIX --> G
    DATA --> G
    G -- Sí --> BRK["Agrega ! y BREAKING CHANGE:"]
    G -- No --> OK["Encabezado ≤ 72 caracteres y commit"]
    BRK --> OK
```

---

## 🧩 Elementos Afectados

| Tipo de Elemento | Aplicación del Estándar |
| --- | --- |
| Código fuente | Formato de commits, alcance ligado a US o DEF. |
| Artefactos de datos L3/L4 | Tipo `data` con fuente, periodo, territorio y validación obligatorios. |
| Configuración de despliegue y CI | Tipos `ci` y `build`. |
| Documentación técnica en el repositorio | Tipo `docs`. La versión documental del archivo sigue `STD-VERSIONAMIENTO`. |
| Títulos de pull request | Mismo formato que el encabezado del commit (especificación 9). |
| Commits de promoción y back-merge | Formato `chore(release)` (especificación 10). |
| Notas de versión (GitHub Releases) | Se generan agrupando commits por tipo desde el último tag. |

---

## 📊 Criterios de Cumplimiento y Verificación

- **Método de verificación:** commitlint en el hook `commit-msg` (preventivo) y como check obligatorio en cada PR; revisión par del título del PR antes de fusionar; muestreo del historial en el corte semanal.
- **Criterio de aceptación:** 100 % de los commits en `develop`, `staging` y `main` conformes; 0 PR fusionados con el check de commitlint en rojo; 100 % de commits `fix` con `Closes: DEF-NN` y de commits `data` con fuente y validación.
- **Frecuencia:** En cada commit y en cada PR (automática); semanal, en el corte de los domingos (auditoría).
- **Responsable de verificación:** Revisor par del PR; en el corte semanal, Angel verifica los commits de Kira y viceversa.

---

## ⚠️ Excepciones y No Cumplimiento

- **Proceso de excepción:** Se solicita en el canal del proyecto en Discord, indicando el commit, la especificación que no se cumple y el motivo. La aprueba el Dueño del estándar y se registra en el Control de Modificaciones. Los commits generados automáticamente por herramientas (por ejemplo, Dependabot) quedan exceptuados si se fusionan con un título de PR conforme.
- **Consecuencias de incumplimiento:**

| Situación | Consecuencia |
| --- | --- |
| Commit no conforme en una rama de trabajo | El check falla y el PR no puede fusionarse hasta corregirlo (se reescribe la rama de trabajo, nunca una permanente). |
| Commit no conforme que llegó a una rama permanente | Se registra como no conformidad en la bitácora; no se reescribe la historia, y el siguiente commit relacionado documenta la referencia faltante. |
| Secreto o dato personal en un mensaje | No conformidad crítica: se rota la credencial y se aplica el procedimiento de `STD-ESTRATEGIA-RAMAS`. |

---

## ⚖️ Marco Normativo y Estándares de Referencia

- CMMI-DEV v1.3 — **CM** SP 2.1, SP 3.1 · **GP 2.6** (Controlar productos de trabajo)
- ISO/IEC/IEEE 12207:2017 — Proceso de gestión de configuración
- Conventional Commits 1.0.0 — https://www.conventionalcommits.org/es/v1.0.0/
- Semantic Versioning 2.0.0 — https://semver.org/lang/es/
- `POL-GESTION-CONFIGURACION` · `POL-REVISION-TRABAJO` · `STD-VERSIONAMIENTO` · `STD-ESTRATEGIA-RAMAS`

---

## 🔗 Related Resources

- `STD-ESTRATEGIA-RAMAS` — Estándar de Estrategia de Ramas y Promoción entre Entornos (`STD-ESTRATEGIA-RAMAS-v0.1.md`)
- `POL-GESTION-CONFIGURACION` — Política de Gestión de Configuración
- `POL-REVISION-TRABAJO` — Política de Revisión y Aceptación del Trabajo
- `TPL-ESTANDAR` — Plantilla de Estándar
- commitlint — https://commitlint.js.org/
- Bitácora de defectos

---

## 🔄 Vigencia y Revisión

Este estándar será revisado al cierre de cada sprint mientras dure el proyecto, y en la retrospectiva final, o antes si cambian las herramientas de validación o la estrategia de ramas. Los cambios menores los aprueba el Propietario del documento; las versiones mayores, el CCB.

---

## 📝 Control de Modificaciones

| # | Versión | Tipo | Autor(es) | Modificación Realizada | Aprobó | Fecha |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.1 | Creación | Angel Mauricio Ramirez | Creación inicial del documento | — | 08/10/2026 |
