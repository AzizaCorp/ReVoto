/**
 * Secuencia narrativa (RF-01 a RF-03, HU-31). Orden fijo de W-01 a W-10; las pantallas
 * Should/Could pueden retirarse y la secuencia se acorta sin romper el progreso (SRS 10.3).
 */
export const PANTALLAS = [
  { id: 'W-01', nombre: 'Portada', prioridad: 'must' },
  { id: 'W-02', nombre: 'Elige tu territorio', prioridad: 'must' },
  { id: 'W-03', nombre: 'México votó', prioridad: 'must' },
  { id: 'W-04', nombre: 'Tu territorio', prioridad: 'must' },
  { id: 'W-05', nombre: 'Quince años de elecciones', prioridad: 'must' },
  { id: 'W-06', nombre: 'Tu generación', prioridad: 'must' },
  { id: 'W-07', nombre: 'Mujeres y hombres', prioridad: 'should' },
  { id: 'W-08', nombre: 'Urbano, rural, mixto', prioridad: 'could' },
  { id: 'W-09', nombre: 'El arquetipo de tu zona', prioridad: 'should' },
  { id: 'W-10', nombre: 'Tu resumen', prioridad: 'must' },
] as const;

export type IdPantalla = (typeof PANTALLAS)[number]['id'];

export interface Secuencia {
  readonly pantallas: readonly IdPantalla[];
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

export interface Progreso {
  readonly posicion: number;
  readonly total: number;
  /** Texto para la región aria-live (HU-14). */
  readonly texto: string;
}

export function progreso(s: Secuencia, actual: IdPantalla): Progreso {
  const i = s.pantallas.indexOf(actual);
  if (i < 0) throw new Error(`${actual} no forma parte de la secuencia`);
  const total = s.pantallas.length;
  return { posicion: i + 1, total, texto: `Pantalla ${i + 1} de ${total}` };
}

/** Sin avance automático ni vuelta circular (HU-10): en los extremos regresa null. */
export function siguiente(s: Secuencia, actual: IdPantalla): IdPantalla | null {
  return s.pantallas[s.pantallas.indexOf(actual) + 1] ?? null;
}

export function anterior(s: Secuencia, actual: IdPantalla): IdPantalla | null {
  const i = s.pantallas.indexOf(actual);
  return i > 0 ? (s.pantallas[i - 1] ?? null) : null;
}
