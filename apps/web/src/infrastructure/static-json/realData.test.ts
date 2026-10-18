// Contract test: the adapters read the L4 files published in apps/web/public/data.
import { compareTerritory, getPlaceInState } from '@/application';
import { municipality, NATIONAL, state, type Territory } from '@/domain';
import { fetchFromDisk, hasRealData as available } from '@/test/realData';
import { JsonClient } from './JsonClient';
import { JsonGeographyRepository } from './JsonGeographyRepository';
import { JsonQualityRepository } from './JsonQualityRepository';
import { JsonTurnoutRepository } from './JsonTurnoutRepository';

const client = new JsonClient('/data', fetchFromDisk);
const repo = new JsonTurnoutRepository(client);
const iztacalco = municipality(9, 6, 'Iztacalco', 'Ciudad de México', 'cvegeo:09006') as Extract<
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
    expect(p.neighbours).toEqual(['cvegeo:09007', 'cvegeo:09014', 'cvegeo:09015', 'cvegeo:09017']);
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

  it('reads the quality report even without manifest or calidad.json', async () => {
    const r = await new JsonQualityRepository(client).report();
    expect(r.source).toBe('INE · CCPC');
    expect(r.maxDifferencePoints).toBeNull();
  });

  it('leaves out of the series the elections without a rate (RN-05 per election)', async () => {
    const chiapas = await repo.municipalities(7);
    const oxchuc = chiapas.find((t) => t.name === 'Oxchuc') as Extract<
      Territory,
      { level: 'municipality' }
    >;
    expect(oxchuc.key).toBe('cvegeo:07064');
    const s = await repo.series(oxchuc);
    expect(s.status).toBe('published');
    if (s.status === 'published') {
      expect(s.elections.map((e) => e.election.year)).toEqual([2009, 2012, 2015, 2018, 2024]);
    }
  });

  it('does not offer municipalities whose territorial identity is unresolved', async () => {
    const chiapas = await repo.municipalities(7);
    expect(chiapas.some((t) => t.name === 'El Parral')).toBe(false);
  });

  it('reads the maps: states and a state keyed by municipality key, and turnout by state', async () => {
    const geo = new JsonGeographyRepository(client);
    const states = await geo.states();
    expect(states.areas).toHaveLength(32);
    expect(states.areas.find((a) => a.id === '22')?.name).toBe('Querétaro');
    const [minX, minY, maxX, maxY] = states.bounds;
    expect(maxX - minX).toBeGreaterThan(maxY - minY); // Mexico is wider than tall
    const cdmx = await geo.municipalities(9);
    expect(cdmx.areas).toHaveLength(16);
    expect(cdmx.areas.find((a) => a.id === 'cvegeo:09006')?.name).toBe('Iztacalco');
    const turnout = await geo.statesTurnout();
    expect(turnout.size).toBe(32);
    expect(turnout.get(9)?.turnout[2024]).toBe(0.693);
  });

  it('names the archetype by its published name, not by the pipeline cluster number', async () => {
    const mulege = municipality(3, 2, 'Mulegé', 'Baja California Sur', 'cvegeo:03002') as Extract<
      Territory,
      { level: 'municipality' }
    >;
    const cosio = municipality(1, 4, 'Cosío', 'Aguascalientes', 'cvegeo:01004') as Extract<
      Territory,
      { level: 'municipality' }
    >;
    // Published as A3 «Bajando el ritmo» and A5 «Montaña rusa».
    expect((await repo.municipalityProfile(mulege)).archetype?.archetype).toBe('A5');
    expect((await repo.municipalityProfile(cosio)).archetype?.archetype).toBe('A3');
  });
});
