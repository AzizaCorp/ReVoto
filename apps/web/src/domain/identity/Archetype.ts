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
