import { parentTerritory, type Territory, type TurnoutSeries } from '@/domain';
import type { TurnoutRepository } from '../ports/TurnoutRepository';

export interface TurnoutResult {
  /** Territory the person chose. */
  readonly requested: Territory;
  /** Series to show: the requested one or, if below the threshold, the parent's. */
  readonly series: Extract<TurnoutSeries, { status: 'published' }>;
  /** Present when the level was raised (RN-05, CU-02 A2): the UI shows the explanatory note. */
  readonly notice?: 'threshold-rn05';
}

/**
 * CU-02 · Get the turnout of a territory.
 * If the territory does not reach the publication threshold, it goes up one level until it finds
 * a published series and flags it with `notice`.
 */
export async function getTurnout(
  repo: TurnoutRepository,
  requested: Territory,
): Promise<TurnoutResult> {
  let current: Territory | null = requested;
  let raised = false;
  while (current) {
    const series = await repo.series(current);
    if (series.status === 'published') {
      return raised ? { requested, series, notice: 'threshold-rn05' } : { requested, series };
    }
    current = parentTerritory(current);
    raised = true;
  }
  throw new Error('RN-05: the national level must always be published');
}
