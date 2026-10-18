/**
 * RN-02: only three levels are published. The electoral section is internal to the pipeline
 * and does not exist in the app domain.
 */
export type TerritoryLevel = 'national' | 'state' | 'municipality';

export type Territory =
  | { readonly level: 'national'; readonly name: string }
  | { readonly level: 'state'; readonly stateCode: number; readonly name: string }
  | {
      readonly level: 'municipality';
      readonly stateCode: number;
      /** INE municipality key. Not unique: a few keys were reused across elections. */
      readonly municipalityCode: number;
      /** Unique identity of the municipality (the pipeline's `id_operativo`). */
      readonly key: string;
      readonly name: string;
      readonly stateName: string;
    };

/** The name is shown to people, so it stays in Spanish. */
export const NATIONAL: Territory = { level: 'national', name: 'Nacional' };

export function state(stateCode: number, name: string): Territory {
  if (!Number.isInteger(stateCode) || stateCode < 1 || stateCode > 32) {
    throw new RangeError(`Invalid state code: ${stateCode}`);
  }
  return { level: 'state', stateCode, name };
}

export function municipality(
  stateCode: number,
  municipalityCode: number,
  name: string,
  stateName: string,
  key = `${stateCode}-${municipalityCode}`,
): Territory {
  state(stateCode, stateName);
  if (!Number.isInteger(municipalityCode) || municipalityCode < 1) {
    throw new RangeError(`Invalid municipality code: ${municipalityCode}`);
  }
  return { level: 'municipality', stateCode, municipalityCode, key, name, stateName };
}

/** Text that goes with every figure (RN-10): «Zapopan, Jalisco», «Jalisco», «Nacional». */
export function territoryLabel(t: Territory): string {
  return t.level === 'municipality' ? `${t.name}, ${t.stateName}` : t.name;
}

/** Next level up, used when a municipality does not reach the publication threshold (RN-05). */
export function parentTerritory(t: Territory): Territory | null {
  if (t.level === 'municipality') return state(t.stateCode, t.stateName);
  if (t.level === 'state') return NATIONAL;
  return null;
}
