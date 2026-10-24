import { describe, expect, it } from 'vitest';
import { proportion } from '@/domain';
import type { StateTurnoutPoint } from '../ports/GeographyRepository';
import { stateExtremes } from './stateExtremes';

const point = (name: string, t2024?: number): StateTurnoutPoint => ({
  name,
  turnout: t2024 === undefined ? {} : { 2024: proportion(t2024) },
});

describe('stateExtremes', () => {
  it('returns the states with the highest and lowest turnout of the year', () => {
    const points = new Map([
      [2, point('Baja California', 0.47)],
      [31, point('Yucatán', 0.714)],
      [9, point('Ciudad de México', 0.693)],
    ]);
    const r = stateExtremes(points, 2024);
    expect(r?.highest.name).toBe('Yucatán');
    expect(r?.lowest.name).toBe('Baja California');
  });

  it('ignores states without data and needs at least two', () => {
    const points = new Map([
      [1, point('Aguascalientes')],
      [2, point('Baja California', 0.47)],
    ]);
    expect(stateExtremes(points, 2024)).toBeNull();
  });
});
