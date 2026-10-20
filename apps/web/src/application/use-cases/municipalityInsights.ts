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
import type { StateOverview, TurnoutRepository } from '../ports/TurnoutRepository';
import { municipalTurnoutIn } from './compareTerritory';

type Municipality = Extract<Territory, { level: 'municipality' }>;

export interface PlaceInState {
  readonly rank: StateRank | null;
  /** The five municipalities with the highest turnout (W-08 table). */
  readonly top: readonly MunicipalityTurnout[];
  /** Municipality with the lowest published turnout (last row of the W-08 ranking). */
  readonly lowest: MunicipalityTurnout | null;
}

/** W-08 · Place of a municipality among those of its state, from an overview already read. */
export function placeInState(
  overview: StateOverview,
  municipalityKey: string,
  year: ElectionYear = 2024,
): PlaceInState {
  const list = municipalTurnoutIn(overview.municipalities, year);
  return {
    rank: rankInState(list, municipalityKey),
    top: rankMunicipalities(list).slice(0, 5),
    lowest: rankMunicipalities(list).at(-1) ?? null,
  };
}

/** W-08 · Place of the municipality among those of its state. */
export async function getPlaceInState(
  repo: TurnoutRepository,
  municipality: Municipality,
  year: ElectionYear = 2024,
): Promise<PlaceInState> {
  return placeInState(await repo.stateOverview(municipality.stateCode), municipality.key, year);
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
