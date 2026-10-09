# application

Casos de uso y puertos. Coordina el dominio para cumplir un flujo del SRS y define, como interfaces, lo que necesita del exterior.

- `ports/ParticipacionRepository.ts` · lo que la app necesita de los datos.
- `casos-uso/consultarParticipacion.ts` · CU-02 con elevación de nivel por RN-05.
- `casos-uso/elegirTerritorio.ts` · opciones del selector W-02.
- `errores.ts` · `DatosNoDisponibles`, el único error de datos que conoce la presentación.

Un caso de uso recibe sus dependencias como parámetros (el repositorio), nunca las importa.
