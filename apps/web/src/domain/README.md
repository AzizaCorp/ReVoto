# domain

Reglas de negocio puras del dominio electoral. Sin React, sin `fetch`, sin DTO del contrato: solo TypeScript y pruebas. Si una regla del SRS (RN-NN) se puede expresar como función o tipo, vive aquí.

| Módulo | Reglas |
| --- | --- |
| `election/` | RN-03 tipo de elección (`ElectionType`) |
| `territory/` | RN-02 niveles publicables · RN-05 nivel superior (`parentTerritory`) |
| `turnout/` | RN-01 fórmula (`calculateTurnout`) · RN-04 grupos de edad · RN-06 sexo · RN-09 rango de edad · RN-10 `Figure` con contexto |
| `narrative/` | RF-01 a RF-03 secuencia y progreso (`Sequence`, `progress`) · degradación SRS 10.3 |
