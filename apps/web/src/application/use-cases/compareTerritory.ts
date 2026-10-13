import {
  NATIONAL,
  averageTurnout,
  pointDifference,
  state,
  type ElectionYear,
  type Figure,
  type MunicipalityTurnout,
  type Proportion,
  type Territory,
  type TurnoutSeries,
} from '@/domain';
import type { TurnoutRepository } from '../ports/TurnoutRepository';
import { getTurnout } from './getTurnout';

type Municipality = Extract<Territory, { level: 'municipality' }>;

export interface TerritoryComparison {
  readonly year: ElectionYear;
  /** Figure of the chosen territory, or of its state if the municipality is below RN-05. */
  readonly own: Figure;
  readonly registeredVoters: number;
  readonly state: Figure | null;
  readonly national: Figure;
  /** Simple mean of the bordering municipalities (municipalities only). */
  readonly neighbours: { readonly average: Proportion; readonly count: number } | null;
  /** Own − national, in points. */
  readonly differenceVsNational: number;
  readonly notice?: 'threshold-rn05';
}

const at = (s: Extract<TurnoutSeries, { status: 'published' }>, year: ElectionYear) =>
  s.elections.find((e) => e.election.year === year) ?? null;

/** Municipalities of the overview as plain turnout of one year. */
export const turnoutIn = (
  municipalities: readonly {
    municipality: Municipality;
    suppressed: boolean;
    turnout: Partial<Record<ElectionYear, Proportion>>;
  }[],
  year: ElectionYear,
): MunicipalityTurnout[] =>
  municipalities.map((m) => ({
    code: m.municipality.municipalityCode,
    name: m.municipality.name,
    turnout: m.suppressed ? null : (m.turnout[year] ?? null),
  }));

/**
 * W-04 · Your territory against its state, the country and its neighbours (RF-07).
 * Returns null if the territory has no figure for that year.
 */
export async function compareTerritory(
  repo: TurnoutRepository,
  territory: Territory,
  year: ElectionYear = 2024,
): Promise<TerritoryComparison | null> {
  const [own, national] = await Promise.all([getTurnout(repo, territory), repo.series(NATIONAL)]);
  const ownFigures = at(own.series, year);
  const nationalFigures = national.status === 'published' ? at(national, year) : null;
  if (!ownFigures || !nationalFigures) return null;

  let stateFigure: Figure | null = null;
  let neighbours: TerritoryComparison['neighbours'] = null;
  if (territory.level === 'municipality') {
    const parent = state(territory.stateCode, territory.stateName);
    const [stateSeries, overview, profile] = await Promise.all([
      repo.series(parent),
      repo.stateOverview(territory.stateCode),
      repo.municipalityProfile(territory),
    ]);
    stateFigure =
      stateSeries.status === 'published' ? (at(stateSeries, year)?.total ?? null) : null;
    const average = averageTurnout(turnoutIn(overview.municipalities, year), profile.neighbours);
    neighbours = average === null ? null : { average, count: profile.neighbours.length };
  }

  return {
    year,
    own: ownFigures.total,
    registeredVoters: ownFigures.registeredVoters,
    state: stateFigure,
    national: nationalFigures.total,
    neighbours,
    differenceVsNational: pointDifference(ownFigures.total.value, nationalFigures.total.value),
    ...(own.notice ? { notice: own.notice } : {}),
  };
}
