import type { ElectionType, ElectionYear } from '../election';
import { pointDifference, proportion, type Proportion } from './Proportion';
import type { ElectionTurnout } from './TurnoutSeries';

/** Figures of one election in a series, or null if that year has no data. */
export function turnoutIn(
  elections: readonly ElectionTurnout[],
  year: ElectionYear,
): ElectionTurnout | null {
  return elections.find((e) => e.election.year === year) ?? null;
}

/** Most recent election of a type (W-03: «presidencial» → 2024, «intermedia» → 2021). */
export function latestOfType(
  elections: readonly ElectionTurnout[],
  type: ElectionType,
): ElectionTurnout | null {
  return elections.filter((e) => e.election.type === type).at(-1) ?? null;
}

/**
 * RN-03 · Mean turnout of one election type (W-05). Presidential and midterm elections are never
 * mixed in the same average.
 */
export function averageByType(
  elections: readonly ElectionTurnout[],
  type: ElectionType,
): Proportion | null {
  const values = elections.filter((e) => e.election.type === type).map((e) => e.total.value);
  return values.length ? proportion(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

/** Change in points between two elections of the series (W-05 «De 2018 a 2024»). */
export function changeBetween(
  elections: readonly ElectionTurnout[],
  from: ElectionYear,
  to: ElectionYear,
): number | null {
  const a = turnoutIn(elections, from);
  const b = turnoutIn(elections, to);
  return a && b ? pointDifference(b.total.value, a.total.value) : null;
}

/** Difference in points a − b, or null if either is missing (age and sex gaps, W-06 and W-07). */
export function gap(a: Proportion | undefined, b: Proportion | undefined): number | null {
  return a === undefined || b === undefined ? null : pointDifference(a, b);
}
