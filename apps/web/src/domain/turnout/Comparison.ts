import { proportion, type Proportion } from './Proportion';

/** Turnout of one municipality in one election; null when suppressed (RN-05) or without data. */
export interface MunicipalityTurnout {
  readonly code: number;
  readonly name: string;
  readonly turnout: Proportion | null;
}

export interface StateRank {
  /** 1 = highest turnout in the state. */
  readonly position: number;
  /** Municipalities with a published figure. */
  readonly total: number;
  /** Share of the other municipalities with a lower turnout («vota más que el N %»). */
  readonly aheadOf: Proportion;
}

const byTurnout = (a: MunicipalityTurnout, b: MunicipalityTurnout) =>
  (b.turnout ?? 0) - (a.turnout ?? 0) || a.name.localeCompare(b.name, 'es');

/** Municipalities with a figure, highest turnout first (W-08). */
export function rankMunicipalities(list: readonly MunicipalityTurnout[]): MunicipalityTurnout[] {
  return list.filter((m) => m.turnout !== null).sort(byTurnout);
}

/** W-08 · Place of a municipality in its state. Null if it has no published figure. */
export function rankInState(list: readonly MunicipalityTurnout[], code: number): StateRank | null {
  const ranked = rankMunicipalities(list);
  const index = ranked.findIndex((m) => m.code === code);
  if (index < 0) return null;
  const total = ranked.length;
  const below = total - index - 1;
  return { position: index + 1, total, aheadOf: proportion(total > 1 ? below / (total - 1) : 0) };
}

/**
 * W-04 · «Tus vecinos (promedio)»: simple mean of the neighbours' turnout, leaving out those
 * without a figure. Null if none has one.
 */
export function averageTurnout(
  list: readonly MunicipalityTurnout[],
  codes: readonly number[],
): Proportion | null {
  const values = list
    .filter((m) => codes.includes(m.code) && m.turnout !== null)
    .map((m) => m.turnout as number);
  if (values.length === 0) return null;
  return proportion(values.reduce((a, b) => a + b, 0) / values.length);
}
