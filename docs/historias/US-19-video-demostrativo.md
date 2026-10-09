# US-19 · Producir el video demostrativo

| Campo | Valor |
| --- | --- |
| **Épica** | [E-07 Entrega y difusión](https://app.notion.com/p/3efa4b89591481e2ac03eb237d82eb78) |
| **Prioridad (MoSCoW)** | Must |
| **Story Points** | 3 |
| **Sprint** | Sprint 4 (24-31 oct) |
| **Responsable** | Kira |
| **Revisor (D3)** | Angel |
| **Fecha compromiso** | 26/10/2026 |
| **Estado** | Not started |
| **Ficha en Notion** | [User Story Backlog · US-19](https://app.notion.com/p/3efa4b895914817fb819d5a0328ab99b) |

## 🎯 Objetivo

> **Como** jurado del hackathon,
> **quiero** ver en 3 minutos el problema, la solución y el funcionamiento del MVP,
> **para** evaluar el proyecto sin tener que explorarlo por mi cuenta.

## 🔗 Trazabilidad

| Artefacto | Referencia |
| --- | --- |
| SRS | SRS-01 · REF-03 Base Séptima de la convocatoria · AP-08 |
| Objetivos del producto | OBJ-07 |
| Requisitos no funcionales | RNF-15 |
| Pantallas / interfaz | — |
| Casos de uso | — |
| Entregable | [D14 - Video demostrativo](https://app.notion.com/p/3efa4b89591481629e71e644ed247041) en la base de Deliverables |
| Actividad del PVG | 6.2 Guion, storyboard, grabación y edición del video en la hoja PVG general |
| Rama de GitHub | `feat/US-19-video-demostrativo` |
| Pull request | [liga] |
| Diseño en Figma | No aplica |
| Depende de | [US-17 Probar en dispositivos reales y cerrar defectos](./US-17-pruebas-dispositivos.md)<br/>[US-18 Redactar el guion narrativo y la propuesta de difusión](./US-18-guion-difusion.md) |
| Bloquea a | [US-20 Empaquetar, verificar y enviar la entrega final](./US-20-paquete-envio-final.md) |
| Prácticas CMMI-DEV v1.3 | PI SP 3.4 (empaquetar y entregar) · VAL SP 2.2 · PPQA SP 1.2 |

## ✅ Criterios de aceptación

| # | Criterio | Verificación / evidencia | Resultado |
| --- | --- | --- | --- |
| CA-01 | **Dado** el video, **cuando** se entregue, **entonces** dura 3 minutos o menos en MP4 a 1080p. | Metadatos del archivo | ⬜ Pendiente |
| CA-02 | **Dado** el contenido, **cuando** se revise, **entonces** presenta problema, solución, funcionamiento del MVP y valor público. | Checklist del storyboard | ⬜ Pendiente |
| CA-03 | **Dado** el audio, **cuando** se escuche, **entonces** es inteligible de principio a fin. | Revisión del otro integrante | ⬜ Pendiente |
| CA-04 | **Dada** la liga de alojamiento, **cuando** se abra en ventana de incógnito, **entonces** carga sin solicitar acceso. | Prueba en incógnito (AP-08) | ⬜ Pendiente |

## 🧭 Diagrama

```mermaid
flowchart LR
    G[Guion US-18] --> SB[Storyboard]
    SB --> GR[Grabación OBS<br/>MVP en dispositivo]
    GR --> ED[Edición CapCut / Alight Motion]
    ED --> MP4[MP4 1080p ≤ 3 min] --> YT[Alojamiento público]
```

## 📋 Definition of Done aplicable

[READY-DONE](https://app.notion.com/p/3efa4b895914805c8f93e8d584df38a2) · EST-01: lista universal D1 a D7 + sección específica **C4 · Video (MP4 1080p ≤ 3 min, liga verificada en incógnito)**.

**Definition of Ready**

- [ ] R1 · Entregable identificable
- [ ] R2 · Criterios de aceptación Dado / Cuando / Entonces
- [ ] R3 · Dimensionada (AP), responsable y fecha planeada
- [ ] R4 · Dependencias disponibles hoy

**Definition of Done**

- [ ] D1 · Entregable existe y está terminado
- [ ] D2 · Todos los CA se cumplen (tabla de arriba con ✅)
- [ ] D3 · Revisado por Angel (PR o bitácora)
- [ ] D4 · Versionado y accesible
- [ ] D5 · Sin no conformidades críticas abiertas
- [ ] D6 · PVG actualizado (Toggl, fecha real)
- [ ] D7 · Sin datos personales ni credenciales

## 📝 Notas y decisiones

- Vence el 26/10 pero depende de US-17 (27/10): el video graba un MVP aún sin cerrar defectos. Sugerencia: mover a 28/10 o grabar sobre un build congelado.
- AP-08 (plataforma de alojamiento y permisos) es dependencia DoR R4.

---

| # | Autor | Modificación | Fecha |
| --- | --- | --- | --- |
| 1 | Angel | Creación del archivo a partir del User Story Backlog de Notion y SRS-01 | 06/10/2026 |
