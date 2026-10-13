// Application layer: use cases and ports. Orchestrates the domain; knows neither React nor fetch.
export type { TurnoutRepository } from './ports/TurnoutRepository';
export { DataUnavailable } from './errors';
export { getTurnout, type TurnoutResult } from './use-cases/getTurnout';
export { listStates, listMunicipalities } from './use-cases/chooseTerritory';
