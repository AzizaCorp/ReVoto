import { NATIONAL, state, type Territory, type TurnoutSeries } from '@/domain';
import type {
  MunicipalityProfile,
  StateOverview,
  TurnoutRepository,
} from '../ports/TurnoutRepository';
import { getTurnout } from './getTurnout';

type Published = Extract<TurnoutSeries, { status: 'published' }>;

/**
 * Everything the story (W-03 to W-10 and W-15) needs about the chosen territory, read once.
 * The pages derive their figures from it with the domain rules.
 */
export interface TerritoryStory {
  /** Territory the person chose. */
  readonly territory: Territory;
  /** Its series or, below RN-05, its state's (then `notice` is set). */
  readonly own: Published;
  readonly notice?: 'threshold-rn05';
  readonly national: Published;
  /** Series of the state (the territory itself when a state was chosen); null if national. */
  readonly state: Published | null;
  readonly overview: StateOverview | null;
  readonly profile: MunicipalityProfile | null;
}

const published = (s: TurnoutSeries): Published => {
  if (s.status !== 'published')
    throw new Error('RN-05: states and the country are always published');
  return s;
};

/** Reads the chosen territory, its state and the country in parallel. */
export async function getTerritoryStory(
  repo: TurnoutRepository,
  territory: Territory,
): Promise<TerritoryStory> {
  const stateCode = territory.level === 'national' ? null : territory.stateCode;
  const [own, national, stateSeries, overview, profile] = await Promise.all([
    getTurnout(repo, territory),
    repo.series(NATIONAL),
    territory.level === 'municipality'
      ? repo.series(state(territory.stateCode, territory.stateName))
      : null,
    stateCode ? repo.stateOverview(stateCode) : null,
    territory.level === 'municipality' ? repo.municipalityProfile(territory) : null,
  ]);
  return {
    territory,
    own: own.series,
    ...(own.notice ? { notice: own.notice } : {}),
    national: published(national),
    state: stateSeries ? published(stateSeries) : territory.level === 'state' ? own.series : null,
    overview,
    profile,
  };
}
