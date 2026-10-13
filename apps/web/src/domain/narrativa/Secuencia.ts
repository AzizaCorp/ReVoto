/**
 * Secuencia narrativa (RF-01 a RF-03, HU-31). Orden fijo de W-01 a W-10.
 *
 * Un **paso** es una idea de la historia; el indicador de progreso cuenta pasos y nunca pasa de 10
 * (RF-01, US-09 CA-03). Algunos pasos tienen **subpantallas** opcionales que comparten su número:
 * W-02b (Sobre ti) en el paso 2, y W-09b (Tu insignia) y W-09c (Mi municipio y yo) en el paso 9.
 * Las pantallas Should/Could pueden retirarse y la secuencia se acorta sin romper el progreso
 * (SRS 10.3).
 */
export const PANTALLAS = [
  { id: 'W-01', paso: 1, nombre: 'Portada', prioridad: 'must' },
  { id: 'W-02', paso: 2, nombre: 'Elige tu territorio', prioridad: 'must' },
  { id: 'W-02b', paso: 2, nombre: 'Sobre ti', prioridad: 'could' },
  { id: 'W-03', paso: 3, nombre: 'México votó', prioridad: 'must' },
  { id: 'W-04', paso: 4, nombre: 'Tu territorio', prioridad: 'must' },
  { id: 'W-05', paso: 5, nombre: 'Quince años de elecciones', prioridad: 'must' },
  { id: 'W-06', paso: 6, nombre: 'Tu generación', prioridad: 'must' },
  { id: 'W-07', paso: 7, nombre: 'Mujeres y hombres', prioridad: 'should' },
  { id: 'W-08', paso: 8, nombre: 'Tu lugar en tu entidad', prioridad: 'could' },
  { id: 'W-09', paso: 9, nombre: 'El arquetipo de tu municipio', prioridad: 'should' },
  { id: 'W-09b', paso: 9, nombre: 'Tu insignia', prioridad: 'could' },
  { id: 'W-09c', paso: 9, nombre: 'Mi municipio y yo', prioridad: 'could' },
  { id: 'W-10', paso: 10, nombre: 'Tu resumen', prioridad: 'must' },
] as const;

export type IdPantalla = (typeof PANTALLAS)[number]['id'];

/** Máximo de pasos de la historia (RF-01). */
export const MAX_PASOS = 10;

export interface Secuencia {
  readonly pantallas: readonly IdPantalla[];
}

const definicion = (id: IdPantalla) => {
  const p = PANTALLAS.find((x) => x.id === id);
  if (!p) throw new Error(`${id} no es una pantalla de la secuencia`);
  return p;
};

/** Nombre corto de una pantalla, para títulos y anuncios. */
export function nombrePantalla(id: IdPantalla): string {
  return definicion(id).nombre;
}

/** Crea la secuencia. Una pantalla Must nunca puede excluirse. */
export function crearSecuencia(excluir: readonly IdPantalla[] = []): Secuencia {
  const prohibidas = PANTALLAS.filter((p) => p.prioridad === 'must' && excluir.includes(p.id));
  if (prohibidas.length) {
    throw new Error(
      `No se pueden retirar pantallas Must: ${prohibidas.map((p) => p.id).join(', ')}`,
    );
  }
  return { pantallas: PANTALLAS.map((p) => p.id).filter((id) => !excluir.includes(id)) };
}

/** Pasos distintos que quedan en la secuencia, en orden. */
function pasos(s: Secuencia): number[] {
  return [...new Set(s.pantallas.map((id) => definicion(id).paso))];
}

export interface Progreso {
  /** Número de paso (1…total). Las subpantallas comparten el de su paso. */
  readonly posicion: number;
  readonly total: number;
  /** Texto para la región aria-live (HU-14). */
  readonly texto: string;
}

export function progreso(s: Secuencia, actual: IdPantalla): Progreso {
  if (!s.pantallas.includes(actual)) throw new Error(`${actual} no forma parte de la secuencia`);
  const lista = pasos(s);
  const posicion = lista.indexOf(definicion(actual).paso) + 1;
  const total = lista.length;
  return { posicion, total, texto: `Pantalla ${posicion} de ${total}` };
}

/** Sin avance automático ni vuelta circular (HU-10): en los extremos regresa null. */
export function siguiente(s: Secuencia, actual: IdPantalla): IdPantalla | null {
  return s.pantallas[s.pantallas.indexOf(actual) + 1] ?? null;
}

export function anterior(s: Secuencia, actual: IdPantalla): IdPantalla | null {
  const i = s.pantallas.indexOf(actual);
  return i > 0 ? (s.pantallas[i - 1] ?? null) : null;
}

/** Reconoce un identificador escrito en una URL (`w-09c`, `W-09C`) o regresa null. */
export function pantallaDesdeTexto(texto: string): IdPantalla | null {
  const t = texto.trim().toUpperCase().replace(/B$/, 'b').replace(/C$/, 'c');
  return PANTALLAS.find((p) => p.id === t)?.id ?? null;
}
