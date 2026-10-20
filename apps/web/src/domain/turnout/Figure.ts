import type { Election } from '../election';
import type { Territory } from '../territory';
import type { Proportion } from './Proportion';

export interface Source {
  readonly name: string;
  readonly url?: string;
}

/**
 * RN-10: a figure never stands alone. It cannot be built without territory, period and source,
 * so no screen can show a number without its context.
 */
export interface Figure {
  readonly value: Proportion;
  readonly territory: Territory;
  readonly election: Election;
  readonly source: Source;
}

export function figure(
  value: Proportion,
  territory: Territory,
  election: Election,
  source: Source,
): Figure {
  if (!source.name.trim()) throw new Error('RN-10: every figure needs a source');
  return { value, territory, election, source };
}
