import type { Territory, TurnoutSeries } from '@/domain';

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
}
