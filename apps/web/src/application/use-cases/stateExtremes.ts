import type { ElectionYear, Proportion } from '@/domain';
import type { StateTurnoutPoint } from '../ports/GeographyRepository';

export interface StateExtreme {
  readonly code: number;
  readonly name: string;
  readonly turnout: Proportion;
}

export interface StateExtremes {
  readonly highest: StateExtreme;
  readonly lowest: StateExtreme;
}

/**
 * The states with the highest and lowest turnout in one election (W-03). States without data for
 * that year are left out; ties keep the lower state code so the result is stable.
 */
export function stateExtremes(
  points: ReadonlyMap<number, StateTurnoutPoint>,
  year: ElectionYear,
): StateExtremes | null {
  const list: StateExtreme[] = [];
  for (const [code, p] of points) {
    const turnout = p.turnout[year];
    if (turnout !== undefined) list.push({ code, name: p.name, turnout });
  }
  if (list.length < 2) return null;
  list.sort((a, b) => b.turnout - a.turnout || a.code - b.code);
  return { highest: list[0]!, lowest: list[list.length - 1]! };
}
