import {
  NATIONAL,
  election,
  figure,
  municipality,
  proportion,
  state,
  type Territory,
  type TurnoutSeries,
} from '@/domain';
import type { TurnoutRepository } from '../ports/TurnoutRepository';
import { getTurnout } from './getTurnout';

const source = { name: 'Datos sintéticos de prueba' };
const published = (t: Territory): TurnoutSeries => ({
  status: 'published',
  territory: t,
  source,
  elections: [
    {
      election: election(2024),
      total: figure(proportion(0.6), t, election(2024), source),
      registeredVoters: 1000,
      byAge: {},
      bySex: {},
    },
  ],
});

const fakeRepo = (suppressed: Territory['level'][]): TurnoutRepository => ({
  states: async () => [],
  municipalities: async () => [],
  series: async (t) =>
    suppressed.includes(t.level)
      ? { status: 'suppressed', territory: t, reason: 'threshold-rn05' }
      : published(t),
});

describe('getTurnout (CU-02)', () => {
  const small = municipality(14, 117, 'Municipio pequeño', 'Jalisco');

  it('returns the series of the territory when it is published', async () => {
    const r = await getTurnout(fakeRepo([]), small);
    expect(r.series.territory).toEqual(small);
    expect(r.notice).toBeUndefined();
  });

  it('RN-05: if the municipality is below the threshold, shows the state with a notice', async () => {
    const r = await getTurnout(fakeRepo(['municipality']), small);
    expect(r.series.territory).toEqual(state(14, 'Jalisco'));
    expect(r.notice).toBe('threshold-rn05');
    expect(r.requested).toEqual(small);
  });

  it('the national level answers directly', async () => {
    const r = await getTurnout(fakeRepo([]), NATIONAL);
    expect(r.series.territory).toBe(NATIONAL);
  });
});
