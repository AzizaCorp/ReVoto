import { election } from '../election';
import { NATIONAL } from '../territory';
import { averageByType, changeBetween, figure, gap, latestOfType, proportion } from '.';

const source = { name: 'Prueba' };
const e = (year: number, value: number, byAge = {}) => ({
  election: election(year),
  total: figure(proportion(value), NATIONAL, election(year), source),
  registeredVoters: 100,
  byAge,
  bySex: {},
});
const series = [
  e(2009, 0.44),
  e(2012, 0.62),
  e(2015, 0.47),
  e(2018, 0.63),
  e(2021, 0.52),
  e(2024, 0.6),
];

describe('Insights over a series (W-03, W-05)', () => {
  it('RN-03: averages presidential and midterm elections apart', () => {
    expect(averageByType(series, 'presidential')).toBeCloseTo((0.62 + 0.63 + 0.6) / 3);
    expect(averageByType(series, 'midterm')).toBeCloseTo((0.44 + 0.47 + 0.52) / 3);
  });

  it('finds the latest election of each type', () => {
    expect(latestOfType(series, 'presidential')?.election.year).toBe(2024);
    expect(latestOfType(series, 'midterm')?.election.year).toBe(2021);
  });

  it('measures changes and gaps in points', () => {
    expect(changeBetween(series, 2018, 2024)).toBe(-3);
    expect(changeBetween(series.slice(0, 2), 2018, 2024)).toBeNull();
    expect(gap(proportion(0.79), proportion(0.63))).toBe(16);
    expect(gap(undefined, proportion(0.5))).toBeNull();
  });
});
