# Glosario

| Término | Significado |
| --- | --- |
| **LN · Lista nominal** | Personas registradas que pueden votar en una sección. |
| **SV · Sí votó** | Personas de la lista nominal que votaron. |
| **NV · No votó** | Personas de la lista nominal que no votaron. |
| **NS · Sin dato** | Registros sin información de participación. Se excluyen del denominador (RN-01). |
| **Participación ajustada** | SV / (LN − NS). Indicador oficial del proyecto. |
| **Elección intermedia** | Elección federal sin elección presidencial: 2009, 2015, 2021. |
| **Elección presidencial** | 2012, 2018, 2024. |
| **Sección electoral** | Unidad territorial mínima del INE. Solo se usa para calcular; nunca se publica (RN-02). |
| **TIPOSEC** | Tipo de sección: urbana (U), rural (R) o mixta (M). |
| **Conteo censal** | Dataset del INE (DECEYEC) con lista nominal y participación por sección, sexo y edad simple. |
| **Umbral RN-05** | Lista nominal mínima para publicar un agregado. |
| **Arquetipo** | Descripción neutral del perfil de participación de un territorio (W-09, RN-07). |
| **L0 a L4** | Capas de datos: fuentes, staging, normalizado, marts, publicación. |
| **Contrato L4** | Formato de los JSON que consume la app (`packages/contracts`). |
| **DDD** | Domain-Driven Design: la app se organiza en capas `domain`, `application`, `infrastructure` y `presentation` (ADR-0003). |
| **Puerto** | Interfaz que define `application` para lo que necesita del exterior (`ParticipacionRepository`). |
| **Adaptador** | Implementación de un puerto en `infrastructure` (`JsonParticipacionRepository`). |
| **DTO** | Objeto con la forma exacta del JSON; solo existe en `infrastructure` y `packages/contracts`. |
| **W-NN** | Identificador de un wireframe / pantalla. |
| **RIU-NN** | Requisito de interfaz de usuario del SRS. |
| **HU / RF / RNF / RN** | Historia de usuario del SRS / requisito funcional / no funcional / regla de negocio. |
| **US-NN** | Historia del backlog de Notion; es la unidad de trabajo de ramas y commits. |
| **PVG** | Plan de Valor Ganado: avance y costo del proyecto, regla 0/100. |
| **CCB** | Comité de Control de Cambios. |
