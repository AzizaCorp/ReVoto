// Contract test: the adapters read the L4 files published in apps/web/public/data.
import { compareTerritory, getPlaceInState } from '@/application';
import { municipality, NATIONAL, state, type Territory } from '@/domain';
import { fetchFromDisk, hasRealData as available } from '@/test/realData';
import { JsonClient } from './JsonClient';
import { JsonQualityRepository } from './JsonQualityRepository';
import { JsonTurnoutRepository } from './JsonTurnoutRepository';

const client = new JsonClient('/data', fetchFromDisk);
const repo = new JsonTurnoutRepository(client);
const iztacalco = municipality(9, 6, 'Iztacalco', 'Ciudad de México') as Extract<
  Territory,
  { level: 'municipality' }
>;

describe.runIf(available)('L4 data published in public/data', () => {
  it('lists the 32 states and the municipalities of a state, sorted by name', async () => {
    const states = await repo.states();
    expect(states).toHaveLength(32);
    expect(states[8]).toEqual(state(9, 'Ciudad de México'));
    const towns = await repo.municipalities(9);
    expect(towns).toHaveLength(16);
    expect(towns[0]?.name).toBe('Álvaro Obregón');
  });

  it('reads the national series with the six elections, by age and sex', async () => {
    const s = await repo.series(NATIONAL);
    expect(s.status).toBe('published');
    if (s.status !== 'published') return;
    expect(s.elections.map((e) => e.election.year)).toEqual([2009, 2012, 2015, 2018, 2021, 2024]);
    expect(Object.keys(s.elections[5]!.byAge)).toEqual(['18-24', '25-34', '35-44', '45-59', '60+']);
    expect(Object.keys(s.elections[5]!.bySex)).toEqual(['H', 'M']);
  });

  it('reads the profile of a municipality: INEGI key, neighbours and archetype', async () => {
    const p = await repo.municipalityProfile(iztacalco);
    expect(p.inegiCode).toBe('09006');
    expect(p.neighbours).toEqual([7, 14, 15, 17]);
    expect(p.archetype?.archetype).toMatch(/^A[1-5]$/);
  });

  it('feeds the W-04 and W-08 use cases', async () => {
    const c = await compareTerritory(repo, iztacalco);
    expect(c?.own.value).toBe(0.694);
    expect(c?.state?.value).toBe(0.693);
    expect(c?.neighbours?.count).toBe(4);
    const place = await getPlaceInState(repo, iztacalco);
    expect(place.rank?.total).toBe(16);
    expect(place.top).toHaveLength(5);
  });

  it('reads the quality report of the current version', async () => {
    const r = await new JsonQualityRepository(client).report();
    expect(r.version).toMatch(/^\d{8}-[0-9a-f]{7}$/);
    expect(r.checks.find((c) => c.id === 'RF-23')?.result).toBe('pending');
    expect(r.checks.some((c) => c.result === 'failed')).toBe(false);
  });
});
