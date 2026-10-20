import { averageTurnout, proportion, rankInState, rankMunicipalities } from '.';

const list = [
  { code: 'a', name: 'Alto', turnout: proportion(0.8) },
  { code: 'b', name: 'Medio', turnout: proportion(0.6) },
  { code: 'c', name: 'Bajo', turnout: proportion(0.4) },
  { code: 'd', name: 'Suprimido', turnout: null },
];

describe('Comparison within a state (W-04, W-08)', () => {
  it('ranks only municipalities with a figure, highest first', () => {
    expect(rankMunicipalities(list).map((m) => m.code)).toEqual(['a', 'b', 'c']);
  });

  it('places a municipality and says how many it is ahead of', () => {
    expect(rankInState(list, 'b')).toEqual({ position: 2, total: 3, aheadOf: 0.5 });
    expect(rankInState(list, 'a')?.aheadOf).toBe(1);
    expect(rankInState(list, 'd')).toBeNull();
  });

  it('averages the neighbours that have a figure', () => {
    expect(averageTurnout(list, ['a', 'c', 'd'])).toBeCloseTo(0.6);
    expect(averageTurnout(list, ['d'])).toBeNull();
  });
});
