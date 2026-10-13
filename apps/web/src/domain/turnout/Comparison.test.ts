import { averageTurnout, proportion, rankInState, rankMunicipalities } from '.';

const list = [
  { code: 1, name: 'Alto', turnout: proportion(0.8) },
  { code: 2, name: 'Medio', turnout: proportion(0.6) },
  { code: 3, name: 'Bajo', turnout: proportion(0.4) },
  { code: 4, name: 'Suprimido', turnout: null },
];

describe('Comparison within a state (W-04, W-08)', () => {
  it('ranks only municipalities with a figure, highest first', () => {
    expect(rankMunicipalities(list).map((m) => m.code)).toEqual([1, 2, 3]);
  });

  it('places a municipality and says how many it is ahead of', () => {
    expect(rankInState(list, 2)).toEqual({ position: 2, total: 3, aheadOf: 0.5 });
    expect(rankInState(list, 1)?.aheadOf).toBe(1);
    expect(rankInState(list, 4)).toBeNull();
  });

  it('averages the neighbours that have a figure', () => {
    expect(averageTurnout(list, [1, 3, 4])).toBeCloseTo(0.6);
    expect(averageTurnout(list, [4])).toBeNull();
  });
});
