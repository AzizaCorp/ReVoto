# domain

Reglas de negocio puras del dominio electoral. Sin React, sin `fetch`, sin DTO del contrato: solo TypeScript y pruebas. Si una regla del SRS (RN-NN) se puede expresar como función o tipo, vive aquí.

| Módulo | Reglas |
| --- | --- |
| `eleccion/` | RN-03 tipo de elección |
| `territorio/` | RN-02 niveles publicables · RN-05 nivel superior |
| `participacion/` | RN-01 fórmula · RN-04 grupos de edad · RN-06 sexo · RN-09 rango de edad · RN-10 `Cifra` con contexto |
| `narrativa/` | RF-01 a RF-03 secuencia y progreso · degradación SRS 10.3 |
