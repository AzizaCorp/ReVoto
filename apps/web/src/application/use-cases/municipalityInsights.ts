import {
  rankInState,
  rankMunicipalities,
  type AgeGroup,
  type ArchetypeProfile,
  type ElectionYear,
  type MunicipalityTurnout,
  type StateRank,
  type Territory,
} from '@/domain';
import type { TurnoutRepository } from '../ports/TurnoutRepository';
import { turnoutIn } from './compareTerritory';

type Municipality = Extract<Territory, { level: 'municipality' }>;

export interface PlaceInState {
  readonly rank: StateRank | null;
  /** The five municipalities with the highest turnout (W-08 table). */
  readonly top: readonly MunicipalityTurnout[];
}

/** W-08 · Place of the municipality among those of its state. */
export async function getPlaceInState(
  repo: TurnoutRepository,
  municipality: Municipality,
  year: ElectionYear = 2024,
): Promise<PlaceInState> {
  const overview = await repo.stateOverview(municipality.stateCode);
  const list = turnoutIn(overview.municipalities, year);
  return {
    rank: rankInState(list, municipality.municipalityCode),
    top: rankMunicipalities(list).slice(0, 5),
  };
}

/** W-09 · Archetype of the municipality; null with a short history or when suppressed. */
export async function getArchetype(
  repo: TurnoutRepository,
  municipality: Municipality,
): Promise<ArchetypeProfile | null> {
  return (await repo.municipalityProfile(municipality)).archetype;
}

/** W-09b · Elections with a vote expected (of 3) for an age group in a state. */
export async function getExpectedVotes(
  repo: TurnoutRepository,
  stateCode: number,
  ageGroup: AgeGroup,
): Promise<number | null> {
  return (await repo.stateOverview(stateCode)).expectedVotes[ageGroup] ?? null;
}
