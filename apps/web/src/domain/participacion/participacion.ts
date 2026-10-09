import { proporcion, type Proporcion } from './Proporcion';

export interface ConteoParticipacion {
  /** LN · lista nominal */
  listaNominal: number;
  /** SV · sí votó */
  votoSi: number;
  /** NS · sin dato */
  sinDato: number;
}

/**
 * RN-01: participación = SV / (LN − NS). Los registros sin dato se excluyen del denominador;
 * no son abstención. Regresa null si no hay base de cálculo.
 */
export function calcularParticipacion({
  listaNominal,
  votoSi,
  sinDato,
}: ConteoParticipacion): Proporcion | null {
  const base = listaNominal - sinDato;
  return base > 0 ? proporcion(votoSi / base) : null;
}
