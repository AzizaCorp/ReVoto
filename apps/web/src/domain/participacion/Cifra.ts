import type { Eleccion } from '../eleccion';
import type { Territorio } from '../territorio';
import type { Proporcion } from './Proporcion';

export interface Fuente {
  readonly nombre: string;
  readonly url?: string;
}

/**
 * RN-10: una cifra nunca existe sola. No se puede construir sin territorio, periodo y fuente,
 * así que ninguna pantalla puede mostrar un número sin su contexto.
 */
export interface Cifra {
  readonly valor: Proporcion;
  readonly territorio: Territorio;
  readonly eleccion: Eleccion;
  readonly fuente: Fuente;
}

export function cifra(
  valor: Proporcion,
  territorio: Territorio,
  eleccion: Eleccion,
  fuente: Fuente,
): Cifra {
  if (!fuente.nombre.trim()) throw new Error('RN-10: toda cifra necesita una fuente');
  return { valor, territorio, eleccion, fuente };
}
