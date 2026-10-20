import type { ElectionYear, Proportion } from '@/domain';

/** A polygon area already projected (y grows to the north). */
export interface MapArea {
  /** State code or municipality key, depending on the layer. */
  readonly id: string;
  readonly name: string;
  /** Rings of [x, y]; the first of each polygon is the outer one. */
  readonly rings: readonly (readonly (readonly [number, number])[])[];
}

export interface MapLayer {
  readonly areas: readonly MapArea[];
  /** [minX, minY, maxX, maxY] of every area. */
  readonly bounds: readonly [number, number, number, number];
}

export interface StateTurnoutPoint {
  readonly name: string;
  /** Missing year = no data. */
  readonly turnout: Partial<Record<ElectionYear, Proportion>>;
}

/** Output port for the maps (W-02 and W-03 states, W-04 municipalities of a state). */
export interface GeographyRepository {
  /** The 32 states; id = state code. */
  states(): Promise<MapLayer>;
  /** Municipalities of a state; id = municipality key (Territory.key), or CVEGEO if unmatched. */
  municipalities(stateCode: number): Promise<MapLayer>;
  /** Turnout of the 32 states by state code (W-03). Reads every state file: only W-03 asks. */
  statesTurnout(): Promise<ReadonlyMap<number, StateTurnoutPoint>>;
}
