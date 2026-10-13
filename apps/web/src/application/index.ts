// Application layer: use cases and ports. Orchestrates the domain; knows neither React nor fetch.
export type {
  MunicipalityProfile,
  MunicipalitySummary,
  StateOverview,
  TurnoutRepository,
} from './ports/TurnoutRepository';
export type { QualityRepository } from './ports/QualityRepository';
export { DataUnavailable } from './errors';
export { getTurnout, type TurnoutResult } from './use-cases/getTurnout';
export { listStates, listMunicipalities } from './use-cases/chooseTerritory';
export { compareTerritory, type TerritoryComparison } from './use-cases/compareTerritory';
export {
  getArchetype,
  getExpectedVotes,
  getPlaceInState,
  placeInState,
  type PlaceInState,
} from './use-cases/municipalityInsights';
export { getQualityReport } from './use-cases/getQualityReport';
export { getTerritoryStory, type TerritoryStory } from './use-cases/getTerritoryStory';
export type { OpenDataLinks, OpenDataRepository } from './ports/OpenDataRepository';
