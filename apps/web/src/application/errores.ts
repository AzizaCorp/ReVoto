/**
 * Error que la presentación sabe mostrar (W-17: mensaje con causa y botón de reintento, CU-02 E1).
 * Los adaptadores de infraestructura traducen sus fallas a este error.
 */
export class DatosNoDisponibles extends Error {
  constructor(
    public readonly recurso: string,
    public readonly causa: 'red' | 'no-encontrado' | 'invalido',
  ) {
    super(`No se pudieron cargar los datos de ${recurso} (${causa})`);
    this.name = 'DatosNoDisponibles';
  }
}
