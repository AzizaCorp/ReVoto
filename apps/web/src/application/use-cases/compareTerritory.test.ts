import { municipality, NATIONAL, state, type Territory } from '@/domain';
import { memoryTurnoutRepository } from '@/test/memoryRepositories';
import { compareTerritory } from './compareTerritory';
import { getExpectedVotes, getPlaceInState } from './municipalityInsights';

const iztacalco = municipality(9, 6, 'Iztacalco', 'Ciudad de México') as Extract<
  Territory,
  { level: 'municipality' }
>;

describe('compareTerritory (W-04)', () => {
  it('compares a municipality with its state, the country and its neighbours', async () => {
    const c = await compareTerritory(memoryTurnoutRepository(), iztacalco);
    expect(c?.own.value).toBe(0.694);
    expect(c?.state?.value).toBe(0.693);
    expect(c?.national.value).toBe(0.61);
    expect(c?.neighbours?.average).toBeCloseTo((0.72 + 0.73) / 2);
    expect(c?.differenceVsNational).toBe(8.4);
  });

  it('a state has no state row nor neighbours', async () => {
    const c = await compareTerritory(memoryTurnoutRepository(), state(9, 'Ciudad de México'));
    expect(c?.state).toBeNull();
    expect(c?.neighbours).toBeNull();
  });

  it('returns null when there is no figure for the year', async () => {
    expect(await compareTerritory(memoryTurnoutRepository(), NATIONAL, 2009)).toBeNull();
  });
});

describe('municipality insights (W-08, W-09b)', () => {
  it('places the municipality in its state', async () => {
    const p = await getPlaceInState(memoryTurnoutRepository(), iztacalco);
    expect(p.rank).toEqual({ position: 3, total: 3, aheadOf: 0 });
    expect(p.top.map((m) => m.name)).toEqual(['Coyoacán', 'Azcapotzalco', 'Iztacalco']);
  });

  it('reads the expected votes of an age group', async () => {
    expect(await getExpectedVotes(memoryTurnoutRepository(), 9, '18-24')).toBe(1.7);
    expect(await getExpectedVotes(memoryTurnoutRepository(), 9, '60+')).toBeNull();
  });
});
