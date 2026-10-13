import type { Election } from '../election';
import type { Territory } from '../territory';
import type { AgeGroup } from './AgeGroup';
import type { Figure, Source } from './Figure';
import type { Proportion } from './Proportion';
import type { Sex } from './Sex';

export interface ElectionTurnout {
  readonly election: Election;
  readonly total: Figure;
  readonly registeredVoters: number;
  readonly byAge: Partial<Record<AgeGroup, Proportion>>;
  readonly bySex: Partial<Record<Sex, Proportion>>;
}

/**
 * Result of querying a territory. RN-05: if its registered voters do not reach the threshold,
 * it carries no figures and the app must show the parent territory with a note.
 */
export type TurnoutSeries =
  | {
      readonly status: 'published';
      readonly territory: Territory;
      readonly source: Source;
      readonly elections: readonly ElectionTurnout[];
    }
  | {
      readonly status: 'suppressed';
      readonly territory: Territory;
      readonly reason: 'threshold-rn05';
    };
