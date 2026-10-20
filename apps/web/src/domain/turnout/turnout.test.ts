import { election } from '../election';
import { NATIONAL } from '../territory';
import { ageGroupOf, calculateTurnout, figure, pointDifference, proportion } from '.';

describe('Turnout', () => {
  it('RN-01: leaves records without data out of the denominator', () => {
    expect(calculateTurnout({ registeredVoters: 100, voted: 45, noData: 10 })).toBeCloseTo(0.5);
    expect(calculateTurnout({ registeredVoters: 10, voted: 0, noData: 10 })).toBeNull();
  });

  it('RN-04 and RN-09: assigns an age group only between 18 and 110', () => {
    expect(ageGroupOf(18)).toBe('18-24');
    expect(ageGroupOf(60)).toBe('60+');
    expect(ageGroupOf(17)).toBeNull();
    expect(ageGroupOf(140)).toBeNull();
  });

  it('computes the difference in percentage points', () => {
    expect(pointDifference(proportion(0.612), proportion(0.597))).toBe(1.5);
  });

  it('RN-10: does not allow a figure without a source', () => {
    expect(() => figure(proportion(0.597), NATIONAL, election(2024), { name: ' ' })).toThrow(
      'RN-10',
    );
  });
});
