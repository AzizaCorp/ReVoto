import type { TerritoryStory } from '@/application';
import {
  election,
  figure,
  municipality,
  NATIONAL,
  proportion,
  state,
  type ElectionYear,
  type Territory,
} from '@/domain';
import { slideCard, SLIDE_SCREENS } from './slideCards';

const source = { name: 'Datos sintéticos' };
const CDMX = state(9, 'Ciudad de México');
const IZTACALCO = municipality(9, 6, 'Iztacalco', 'Ciudad de México') as Territory;
const YEARS: ElectionYear[] = [2009, 2012, 2015, 2018, 2021, 2024];

const series = (t: Territory, values: number[], breakdown = false) => ({
  status: 'published' as const,
  territory: t,
  source,
  elections: YEARS.map((y, i) => ({
    election: election(y),
    total: figure(proportion(values[i]!), t, election(y), source),
    registeredVoters: 1000,
    byAge:
      breakdown && y === 2024
        ? { '18-24': proportion(0.55), '25-34': proportion(0.6), '60+': proportion(0.72) }
        : {},
    bySex: breakdown && y === 2024 ? { M: proportion(0.73), H: proportion(0.65) } : {},
  })),
});

const story = (territory: Territory): TerritoryStory => {
  const own =
    territory.level === 'national'
      ? series(NATIONAL, [0.441, 0.621, 0.471, 0.624, 0.518, 0.597], true)
      : series(territory, [0.391, 0.672, 0.426, 0.712, 0.518, 0.694]);
  return {
    territory,
    own,
    national: series(NATIONAL, [0.441, 0.621, 0.471, 0.624, 0.518, 0.597], true),
    state:
      territory.level === 'national'
        ? null
        : series(CDMX, [0.4, 0.66, 0.43, 0.7, 0.52, 0.693], true),
    overview:
      territory.level === 'national'
        ? null
        : {
            state: CDMX as Extract<Territory, { level: 'state' }>,
            municipalities: (
              [
                [2, 'Azcapotzalco', 0.72],
                [3, 'Coyoacán', 0.73],
                [6, 'Iztacalco', 0.694],
                [7, 'Iztapalapa', 0.65],
              ] as const
            ).map(([c, n, v]) => ({
              municipality: municipality(9, c, n, 'Ciudad de México') as Extract<
                Territory,
                { level: 'municipality' }
              >,
              suppressed: false,
              turnout: { 2024: proportion(v) },
            })),
            expectedVotes: {},
          },
    profile: territory.level === 'municipality' ? { neighbours: [], archetype: null } : null,
  } as TerritoryStory;
};

const ready = (r: ReturnType<typeof slideCard>) => {
  if (r.status !== 'ready') throw new Error(r.reason);
  return r.card;
};

describe('US-24 · slide cards', () => {
  it('draws a card for every story screen with territory, period and source data', () => {
    for (const screen of SLIDE_SCREENS) {
      const card = ready(slideCard(screen, story(IZTACALCO), IZTACALCO));
      expect(card.screen).toBe(screen);
      expect(card.place).not.toBe('');
      expect(card.period).toMatch(/^20\d\d(–2024)?$/);
      expect(card.figure).not.toMatch(/—/);
    }
  });

  it('W-03 · national turnout of 2024 and the 2009–2024 series with the type of each election', () => {
    const card = ready(slideCard('W-03', story(IZTACALCO), IZTACALCO));
    expect(card.figure).toBe('59.7 %');
    expect(card.title).toBe('−2.7 pts frente a la presidencial de 2018');
    expect(card.bars.map((b) => b.label)).toEqual([
      '2009 · int.',
      '2012 · pres.',
      '2015 · int.',
      '2018 · pres.',
      '2021 · int.',
      '2024 · pres.',
    ]);
    expect(card.bars.map((b) => b.kind)).toContain('midterm');
  });

  it('W-04 · the municipality against its state and the country', () => {
    const card = ready(slideCard('W-04', story(IZTACALCO), IZTACALCO));
    expect(card.figure).toBe('69.4 %');
    expect(card.title).toBe('9.7 pts más que el país');
    expect(card.bars.map((b) => [b.label, b.value])).toEqual([
      ['Iztacalco', '69.4 %'],
      ['Ciudad de México', '69.3 %'],
      ['México', '59.7 %'],
    ]);
    expect(card.place).toBe('Iztacalco, Ciudad de México');
    expect(card.file).toBe('tu-territorio');
  });

  it('W-05 · presidential against midterm averages', () => {
    const card = ready(slideCard('W-05', story(IZTACALCO), IZTACALCO));
    expect(card.figure).toBe('24.8 pts');
    expect(card.figureCaption).toMatch(/más participación que las intermedias/);
  });

  it('W-06 and W-07 · age and sex gaps, from the state while the municipality has none', () => {
    const age = ready(slideCard('W-06', story(IZTACALCO), IZTACALCO));
    expect(age.figure).toBe('17.0 pts');
    expect(age.title).toBe('Quienes tienen 60 + votan más');
    expect(age.place).toBe('Ciudad de México');
    expect(age.bars.map((b) => b.label)).toEqual(['18–24', '25–34', '60 +']);
    const sex = ready(slideCard('W-07', story(IZTACALCO), IZTACALCO));
    expect(sex.figure).toBe('8.0 pts');
    expect(sex.kicker).toBe('LAS MUJERES VOTAN…');
  });

  it('W-08 · place in the state, adding the municipality when it is not in the top 3', () => {
    const card = ready(slideCard('W-08', story(IZTACALCO), IZTACALCO));
    expect(card.figure).toBe('#3');
    expect(card.figureCaption).toBe('de 4 municipios por participación');
    expect(card.bars.at(-1)?.highlight).toBe(true);
  });

  it('W-10 · the key figures of the story, without personal answers', () => {
    const card = ready(slideCard('W-10', story(IZTACALCO), IZTACALCO));
    expect(card.bars.map((b) => b.label)).toEqual([
      'Iztacalco',
      'México',
      'Lugar en Ciudad de México',
      '18–24 vs. 60 +',
      'Mujeres vs. hombres',
    ]);
    expect(card.bars.every((b) => b.ratio === null)).toBe(true);
  });

  it('says what is missing instead of drawing an empty card', () => {
    expect(slideCard('W-04', null, IZTACALCO)).toMatchObject({ status: 'missing' });
    expect(slideCard('W-04', story(NATIONAL), NATIONAL)).toMatchObject({
      status: 'missing',
      needs: 'territory',
    });
    expect(slideCard('W-08', story(NATIONAL), NATIONAL)).toMatchObject({
      status: 'missing',
      needs: 'municipality',
    });
    expect(ready(slideCard('W-10', story(NATIONAL), NATIONAL)).place).toBe('México');
  });
});
