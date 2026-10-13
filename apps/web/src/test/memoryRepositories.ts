// In-memory adapters for tests: a tiny, synthetic territory with every port answered.
import type {
  OpenDataRepository,
  QualityRepository,
  StateOverview,
  TurnoutRepository,
} from '@/application';
import {
  election,
  figure,
  municipality,
  proportion,
  state,
  type Territory,
  type TurnoutSeries,
} from '@/domain';

const source = { name: 'Datos sintéticos de prueba' };
const STATE = state(9, 'Ciudad de México') as StateOverview['state'];
const towns = [
  [2, 'Azcapotzalco', 0.72],
  [3, 'Coyoacán', 0.73],
  [6, 'Iztacalco', 0.694],
] as const;

const series = (t: Territory, value: number): TurnoutSeries => ({
  status: 'published',
  territory: t,
  source,
  elections: [
    {
      election: election(2024),
      total: figure(proportion(value), t, election(2024), source),
      registeredVoters: 1000,
      byAge: {},
      bySex: {},
    },
  ],
});

export function memoryTurnoutRepository(
  overrides: Partial<TurnoutRepository> = {},
): TurnoutRepository {
  return {
    states: async () => [STATE, state(14, 'Jalisco')],
    municipalities: async () => towns.map(([c, n]) => municipality(9, c, n, STATE.name)),
    series: async (t) =>
      series(
        t,
        t.level === 'national'
          ? 0.61
          : t.level === 'state'
            ? 0.693
            : (towns.find(([c]) => c === t.municipalityCode)?.[2] ?? 0.5),
      ),
    stateOverview: async () => ({
      state: STATE,
      municipalities: towns.map(([c, n, v]) => ({
        municipality: municipality(9, c, n, STATE.name) as Extract<
          Territory,
          { level: 'municipality' }
        >,
        suppressed: false,
        turnout: { 2024: proportion(v) },
      })),
      expectedVotes: { '18-24': 1.7 },
    }),
    municipalityProfile: async () => ({ neighbours: [2, 3], archetype: null }),
    ...overrides,
  };
}

export const memoryQualityRepository = (): QualityRepository => ({
  report: async () => ({
    version: '20261013-abcdef0',
    generatedAt: '2026-10-13T16:00:00-06:00',
    source: source.name,
    maxDifferencePoints: null,
    checks: [
      { id: 'RN-05', description: 'Umbral', result: 'passed', detail: '0 municipios suprimidos.' },
      { id: 'RF-23', description: 'Cifras oficiales', result: 'pending', detail: 'Sin cifras.' },
    ],
  }),
});

export const memoryOpenDataRepository = (): OpenDataRepository => ({
  links: async () => ({
    version: '20261013-abcdef0',
    generatedAt: '2026-10-13T16:00:00-06:00',
    turnoutCsv: '/data/20261013-abcdef0/csv/participacion.csv',
    nationalJson: '/data/20261013-abcdef0/nacional.json',
    baseUrl: '/data/20261013-abcdef0/',
  }),
});

export const memoryDependencies = () => ({
  turnout: memoryTurnoutRepository(),
  quality: memoryQualityRepository(),
  openData: memoryOpenDataRepository(),
});
