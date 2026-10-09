# US-21 · Ver el resumen de cifras en una sola vista

| Campo | Valor |
| --- | --- |
| **Épica** | [E-03 Experiencia narrativa](https://app.notion.com/p/3efa4b89591481b68f41f2f07d9e03b2) |
| **Prioridad (MoSCoW)** | Could |
| **Story Points** | 1 |
| **Sprint** | Backlog sin capacidad |
| **Responsable** | Sin asignar |
| **Revisor (D3)** | Por asignar |
| **Fecha compromiso** | — |
| **Estado** | Not started |
| **Ficha en Notion** | [User Story Backlog · US-21](https://app.notion.com/p/3efa4b895914815b9ebfdf49ea39a86f) |

## 🎯 Objetivo

> **Como** adulto con poco tiempo,
> **quiero** ver un resumen de las cifras clave en una sola vista,
> **para** quedarme con lo esencial sin recorrer toda la secuencia.

## 🔗 Trazabilidad

| Artefacto | Referencia |
| --- | --- |
| SRS | SRS-01 · HU-06 → RF-04 |
| Objetivos del producto | OBJ-01 |
| Requisitos no funcionales | RNF-09 |
| Pantallas / interfaz | RIU-08 · W-10 |
| Casos de uso | CU-01 |
| Entregable | Sin entregable (backlog sin capacidad) |
| Actividad del PVG | Sin actividad en el PVG en la hoja PVG general |
| Rama de GitHub | `feat/US-21-resumen-cifras` |
| Pull request | [liga] |
| Diseño en Figma | [liga al frame W-10] |
| Depende de | [US-09 Construir el motor de secuencia de pantallas](./US-09-motor-secuencia.md)<br/>[US-11 Implementar las pantallas de cifras y comparativos](./US-11-pantallas-cifras.md) |
| Bloquea a | — |
| Prácticas CMMI-DEV v1.3 | REQM SP 1.3 (gestionar cambios: fuera de capacidad) · TS SP 3.1 |

## ✅ Criterios de aceptación

| # | Criterio | Verificación / evidencia | Resultado |
| --- | --- | --- | --- |
| CA-01 | **Dado** que estoy en cualquier pantalla, **cuando** presione Ver resumen, **entonces** aparece una vista con las cinco cifras principales. | Prueba desde W-03…W-09 | ⬜ Pendiente |
| CA-02 | **Dado** el resumen, **cuando** presione una cifra, **entonces** regreso a la pantalla que la explica. | Prueba de navegación W-10 → origen | ⬜ Pendiente |

## 🧭 Diagrama

```mermaid
flowchart LR
    ANY[W-03…W-09] -->|Ver resumen| W10[W-10 Resumen<br/>5 cifras]
    W10 -->|cifra| ANY
```

## 📋 Definition of Done aplicable

[READY-DONE](https://app.notion.com/p/3efa4b895914805c8f93e8d584df38a2) · EST-01: lista universal D1 a D7 + sección específica **C1 · Historia implementada (código en `main` vía PR aprobado, desplegado en Vercel, probado en 360 px)**.

**Definition of Ready**

- [ ] R1 · Entregable identificable
- [ ] R2 · Criterios de aceptación Dado / Cuando / Entonces
- [ ] R3 · Dimensionada (AP), responsable y fecha planeada
- [ ] R4 · Dependencias disponibles hoy

**Definition of Done**

- [ ] D1 · Entregable existe y está terminado
- [ ] D2 · Todos los CA se cumplen (tabla de arriba con ✅)
- [ ] D3 · Revisado por Por asignar (PR o bitácora)
- [ ] D4 · Versionado y accesible
- [ ] D5 · Sin no conformidades críticas abiertas
- [ ] D6 · PVG actualizado (Toggl, fecha real)
- [ ] D7 · Sin datos personales ni credenciales

## 📝 Notas y decisiones

- HU-06 es *Should* en el SRS; aquí queda *Could* sin capacidad. Por la decisión D-02 de US-04, W-10 ya funciona como cierre, así que el costo marginal es bajo.
- AP-06 (las cinco cifras del resumen) sigue abierto.

---

| # | Autor | Modificación | Fecha |
| --- | --- | --- | --- |
| 1 | Angel | Creación del archivo a partir del User Story Backlog de Notion y SRS-01 | 06/10/2026 |
