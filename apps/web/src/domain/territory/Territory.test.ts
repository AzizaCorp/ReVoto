import { NATIONAL, municipality, parentTerritory, state, territoryLabel } from './Territory';

describe('Territory (RN-02, RN-05)', () => {
  const zapopan = municipality(14, 120, 'Zapopan', 'Jalisco');

  it('builds the label that goes with every figure', () => {
    expect(territoryLabel(zapopan)).toBe('Zapopan, Jalisco');
    expect(territoryLabel(NATIONAL)).toBe('Nacional');
  });

  it('goes up one level: municipality → state → national', () => {
    expect(parentTerritory(zapopan)).toEqual(state(14, 'Jalisco'));
    expect(parentTerritory(state(14, 'Jalisco'))).toBe(NATIONAL);
    expect(parentTerritory(NATIONAL)).toBeNull();
  });

  it('rejects invalid state codes', () => {
    expect(() => state(33, 'X')).toThrow(RangeError);
  });
});
