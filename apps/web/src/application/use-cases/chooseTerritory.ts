import type { Territory } from '@/domain';
import type { TurnoutRepository } from '../ports/TurnoutRepository';

/** W-02 · Selector options: 32 states and, once one is chosen, its municipalities (HU-28). */
export function listStates(repo: TurnoutRepository): Promise<Territory[]> {
  return repo.states();
}

export function listMunicipalities(
  repo: TurnoutRepository,
  stateCode: number,
): Promise<Territory[]> {
  return repo.municipalities(stateCode);
}
