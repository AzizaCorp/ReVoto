/**
 * Narrative sequence (RF-01 to RF-03, HU-31). Fixed order from W-01 to W-10.
 *
 * A **step** is one idea of the story; the progress indicator counts steps and never goes past 10
 * (RF-01, US-09 CA-03). Some steps have optional **sub-screens** that share their number:
 * W-02b (Sobre ti) in step 2, and W-09b (Tu insignia) and W-09c (Mi municipio y yo) in step 9.
 * Should/Could screens can be removed and the sequence shrinks without breaking the progress
 * (SRS 10.3). Screen names are shown to people, so they stay in Spanish.
 */
export const SCREENS = [
  { id: 'W-01', step: 1, name: 'Inicio', priority: 'must' },
  { id: 'W-02', step: 2, name: 'Elige tu territorio', priority: 'must' },
  { id: 'W-02b', step: 2, name: 'Sobre ti', priority: 'could' },
  { id: 'W-03', step: 3, name: 'México votó', priority: 'must' },
  { id: 'W-04', step: 4, name: 'Tu territorio', priority: 'must' },
  { id: 'W-05', step: 5, name: 'Quince años de elecciones', priority: 'must' },
  { id: 'W-06', step: 6, name: 'Tu generación', priority: 'must' },
  { id: 'W-07', step: 7, name: 'Mujeres y hombres', priority: 'should' },
  { id: 'W-08', step: 8, name: 'Tu lugar en tu entidad', priority: 'could' },
  { id: 'W-09', step: 9, name: 'El arquetipo de tu municipio', priority: 'should' },
  { id: 'W-09b', step: 9, name: 'Tu insignia', priority: 'could' },
  { id: 'W-09c', step: 9, name: 'Mi municipio y yo', priority: 'could' },
  { id: 'W-10', step: 10, name: 'Tu resumen', priority: 'must' },
] as const;

export type ScreenId = (typeof SCREENS)[number]['id'];

/** Maximum number of steps in the story (RF-01). */
export const MAX_STEPS = 10;

export interface Sequence {
  readonly screens: readonly ScreenId[];
}

const definition = (id: ScreenId) => {
  const s = SCREENS.find((x) => x.id === id);
  if (!s) throw new Error(`${id} is not a screen of the sequence`);
  return s;
};

/** Short name of a screen, for titles and announcements. */
export function screenName(id: ScreenId): string {
  return definition(id).name;
}

/** Creates the sequence. A Must screen can never be excluded. */
export function createSequence(exclude: readonly ScreenId[] = []): Sequence {
  const forbidden = SCREENS.filter((s) => s.priority === 'must' && exclude.includes(s.id));
  if (forbidden.length) {
    throw new Error(`Must screens cannot be removed: ${forbidden.map((s) => s.id).join(', ')}`);
  }
  return { screens: SCREENS.map((s) => s.id).filter((id) => !exclude.includes(id)) };
}

/** Distinct steps left in the sequence, in order. */
function steps(s: Sequence): number[] {
  return [...new Set(s.screens.map((id) => definition(id).step))];
}

export interface Progress {
  /** Step number (1…total). Sub-screens share the number of their step. */
  readonly position: number;
  readonly total: number;
  /** Text for the aria-live region (HU-14), shown to people in Spanish. */
  readonly text: string;
}

export function progress(s: Sequence, current: ScreenId): Progress {
  if (!s.screens.includes(current)) throw new Error(`${current} is not part of the sequence`);
  const list = steps(s);
  const position = list.indexOf(definition(current).step) + 1;
  const total = list.length;
  return { position, total, text: `Pantalla ${position} de ${total}` };
}

/** No auto-advance and no wrap-around (HU-10): at the ends it returns null. */
export function next(s: Sequence, current: ScreenId): ScreenId | null {
  return s.screens[s.screens.indexOf(current) + 1] ?? null;
}

export function previous(s: Sequence, current: ScreenId): ScreenId | null {
  const i = s.screens.indexOf(current);
  return i > 0 ? (s.screens[i - 1] ?? null) : null;
}

/** Recognizes an id written in a URL (`w-09c`, `W-09C`) or returns null. */
export function screenFromText(text: string): ScreenId | null {
  const t = text.trim().toUpperCase().replace(/B$/, 'b').replace(/C$/, 'c');
  return SCREENS.find((s) => s.id === t)?.id ?? null;
}
