import type { ElectionYear, Proportion } from '@/domain';

/** A polygon area already projected (metres, y grows to the north). */
export interface MapArea {
  /** State code, INE municipality code or INEGI CVEGEO, depending on the layer. */
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

export interface MunicipalTurnoutPoint {
  readonly name: string;
  readonly stateCode: number;
  /** Missing year = no data or suppressed (RN-05). */
  readonly turnout: Partial<Record<ElectionYear, Proportion>>;
}

/** Output port for the maps (W-02 states, W-03 country by municipality, W-04 state). */
export interface GeographyRepository {
  /** The 32 states; id = state code. */
  states(): Promise<MapLayer>;
  /** Municipalities of a state; id = INE municipality code (CVEGEO if it has none). */
  municipalities(stateCode: number): Promise<MapLayer>;
  /** Every municipality of the country; id = INEGI CVEGEO. Heavy: only W-03 asks for it. */
  country(): Promise<MapLayer>;
  /** Turnout of every municipality of the country by CVEGEO (W-03). */
  countryTurnout(): Promise<ReadonlyMap<string, MunicipalTurnoutPoint>>;
}
