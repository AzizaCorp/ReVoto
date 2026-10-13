/**
 * Municipal archetypes (RF-11): k-means with k = 5 over level, presidential effect, trend and
 * volatility against the country. The pipeline assigns one per municipality.
 */
export const ARCHETYPES = {
  A1: 'Siempre presente',
  A2: 'En ascenso',
  A3: 'Montaña rusa',
  A4: 'De elección grande',
  A5: 'Bajando el ritmo',
} as const;

export type ArchetypeId = keyof typeof ARCHETYPES;
export const ARCHETYPE_IDS = Object.keys(ARCHETYPES) as ArchetypeId[];

/** Dominant trait of a municipality's archetype: which of the four variables sets it apart. */
export type ArchetypeTrait = 'level' | 'presidential-effect' | 'trend' | 'volatility';

/**
 * W-09 · Profile of a municipality's archetype. The four variables are measured against the
 * national average of each election, in percentage points.
 */
export interface ArchetypeProfile {
  readonly archetype: ArchetypeId;
  /** Average difference against the country. */
  readonly level: number;
  /** How much more it rises in presidential elections than the country does. */
  readonly presidentialEffect: number;
  /** Points per decade. */
  readonly trend: number;
  /** How unpredictable it is. */
  readonly volatility: number;
  /** 1 = at the centre of its group, 0 = at its edge. */
  readonly typicality: number;
  readonly trait: ArchetypeTrait;
}
