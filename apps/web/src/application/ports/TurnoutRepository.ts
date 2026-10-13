import type {
  AgeGroup,
  ArchetypeProfile,
  ElectionYear,
  Proportion,
  Territory,
  TurnoutSeries,
} from '@/domain';

/** A municipality as listed in its state file: enough to rank it and to average neighbours. */
export interface MunicipalitySummary {
  readonly municipality: Extract<Territory, { level: 'municipality' }>;
  /** INEGI geostatistical key (CVEGEO): joins figures with the map. Not always the INE key. */
  readonly inegiCode?: string;
  /** RN-05: below the threshold; it has no figures. */
  readonly suppressed: boolean;
  readonly turnout: Partial<Record<ElectionYear, Proportion>>;
}

export interface StateOverview {
  readonly state: Extract<Territory, { level: 'state' }>;
  readonly municipalities: readonly MunicipalitySummary[];
  /** W-09b · Elections with a vote expected out of 3 (2018, 2021, 2024), by age group. */
  readonly expectedVotes: Partial<Record<AgeGroup, number>>;
}

export interface MunicipalityProfile {
  readonly inegiCode?: string;
  /** INE keys of the bordering municipalities in the same state (W-04). */
  readonly neighbours: readonly number[];
  /** W-09 · Null with fewer than 5 elections or when suppressed. */
  readonly archetype: ArchetypeProfile | null;
}

/**
 * Output port: what the application needs to know about the data, wherever it comes from.
 * Today it is implemented by infrastructure/static-json (JSON files on the CDN). If there is ever
 * a backend, another adapter with this same interface is added and nothing else changes (ADR-0001).
 */
export interface TurnoutRepository {
  /** The 32 states, for the W-02 selector. */
  states(): Promise<Territory[]>;
  /** Municipalities of a state, for the dependent W-02 selector. */
  municipalities(stateCode: number): Promise<Territory[]>;
  /** 2009–2024 series of a territory. A municipality below the threshold returns 'suppressed'. */
  series(territory: Territory): Promise<TurnoutSeries>;
  /** Every municipality of a state with its turnout by year, plus the expected votes by age. */
  stateOverview(stateCode: number): Promise<StateOverview>;
  /** Neighbours and archetype of a municipality. */
  municipalityProfile(
    municipality: Extract<Territory, { level: 'municipality' }>,
  ): Promise<MunicipalityProfile>;
}
