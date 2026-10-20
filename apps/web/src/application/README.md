# application

Casos de uso y puertos. Coordina el dominio para cumplir un flujo del SRS y define, como interfaces, lo que necesita del exterior.

- `ports/TurnoutRepository.ts` · lo que la app necesita de los datos.
- `use-cases/getTurnout.ts` · CU-02 con elevación de nivel por RN-05.
- `use-cases/chooseTerritory.ts` · opciones del selector W-02 (`listStates`, `listMunicipalities`).
- `errors.ts` · `DataUnavailable`, el único error de datos que conoce la presentación.

Un caso de uso recibe sus dependencias como parámetros (el repositorio), nunca las importa.
