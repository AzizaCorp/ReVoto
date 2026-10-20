import { proportion, type Proportion } from './Proportion';

export interface TurnoutCount {
  /** LN · registered voters (lista nominal) */
  registeredVoters: number;
  /** SV · voted (sí votó) */
  voted: number;
  /** NS · no data (sin dato) */
  noData: number;
}

/**
 * RN-01: turnout = SV / (LN − NS). Records without data are left out of the denominator;
 * they are not abstention. Returns null when there is nothing to divide by.
 */
export function calculateTurnout({
  registeredVoters,
  voted,
  noData,
}: TurnoutCount): Proportion | null {
  const base = registeredVoters - noData;
  return base > 0 ? proportion(voted / base) : null;
}
