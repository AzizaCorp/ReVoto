import { DataUnavailable } from '@/application';
import { NATIONAL, municipality } from '@/domain';
import { JsonClient } from './JsonClient';
import { JsonTurnoutRepository } from './JsonTurnoutRepository';

const VERSION = '20261012-a1b2c3d';
const figures = {
  anio: 2024,
  tipo: 'presidencial',
  participacion: 0.597,
  lista_nominal: 98330348,
  por_edad: { '18-24': 0.55 },
  por_sexo: { M: 0.62 },
};
const files: Record<string, unknown> = {
  '/data/manifest.json': {
    version_datos: VERSION,
    generado: '',
    fuente: 'x',
    validacion: { max_diferencia_pp: 0, reporte: '' },
  },
  [`/data/${VERSION}/nacional.json`]: {
    territorio: { nivel: 'nacional', nombre: 'Nacional' },
    fuente: 'INE (sintético)',
    elecciones: [figures],
  },
  [`/data/${VERSION}/municipio/14-117.json`]: {
    territorio: { nivel: 'municipio', nombre: 'X' },
    fuente: 'INE',
    suprimido: true,
    elecciones: [],
  },
};

const fetcher = vi.fn(async (url: RequestInfo | URL) => {
  const body = files[String(url)];
  return body ? new Response(JSON.stringify(body)) : new Response('', { status: 404 });
});
const repo = new JsonTurnoutRepository(new JsonClient('/data', fetcher as typeof fetch));

describe('JsonTurnoutRepository', () => {
  it('reads the current version from the manifest and maps the DTO to the domain', async () => {
    const series = await repo.series(NATIONAL);
    expect(series.status).toBe('published');
    if (series.status !== 'published') return;
    const [e2024] = series.elections;
    expect(e2024?.election).toEqual({ year: 2024, type: 'presidential' });
    expect(e2024?.total.source.name).toBe('INE (sintético)'); // RN-10
    expect(fetcher).toHaveBeenCalledWith('/data/manifest.json', { cache: 'no-cache' });
  });

  it('marks a municipality below the threshold as suppressed (RN-05)', async () => {
    const series = await repo.series(municipality(14, 117, 'X', 'Jalisco'));
    expect(series.status).toBe('suppressed');
  });

  it('translates a missing file into DataUnavailable (W-17)', async () => {
    await expect(repo.states()).rejects.toBeInstanceOf(DataUnavailable);
  });
});
