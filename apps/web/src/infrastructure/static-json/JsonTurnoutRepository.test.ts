import { DataUnavailable } from '@/application';
import { NATIONAL, municipality } from '@/domain';
import { JsonClient } from './JsonClient';
import { JsonTurnoutRepository } from './JsonTurnoutRepository';

const figures = {
  anio: 2024,
  tipo: 'presidencial',
  participacion: 0.597,
  lista_nominal: 98330348,
  por_edad: { '18-24': 0.55 },
  por_sexo: { M: 0.62 },
};
const files: Record<string, unknown> = {
  '/data/nacional.json': {
    territorio: { nivel: 'nacional', nombre: 'Nacional' },
    fuente: 'INE (sintético)',
    elecciones: [figures],
  },
  '/data/catalogos/entidades.json': [
    { cve: 14, nombre: 'JALISCO', archivo: 'entidad/jalisco.json' },
  ],
  '/data/entidad/jalisco.json': {
    territorio: { nivel: 'entidad', cve: 14, nombre: 'JALISCO' },
    fuente: 'INE',
    elecciones: [figures],
    municipios: [
      {
        cve: 117,
        nombre: 'X',
        id_operativo: 'cvegeo:14117',
        cvegeo: '14117',
        archivo: 'municipio/jalisco/14117_x.json',
        suprimido: true,
      },
      {
        cve: 39,
        nombre: 'Guadalajara',
        id_operativo: 'cvegeo:14039',
        cvegeo: '14039',
        archivo: 'municipio/jalisco/14039_guadalajara.json',
      },
    ],
  },
  '/data/municipio/jalisco/14117_x.json': {
    territorio: { nivel: 'municipio', cve: 117, cveEntidad: 14, nombre: 'X' },
    fuente: 'INE',
    suprimido: true,
    elecciones: [{ anio: 2024, tipo: 'presidencial', estado_tasa: 'suppressed', suprimido: true }],
  },
  '/data/municipio/jalisco/14039_guadalajara.json': {
    territorio: { nivel: 'municipio', cve: 39, cveEntidad: 14, nombre: 'Guadalajara' },
    fuente: 'INE',
    suprimido: false,
    elecciones: [{ anio: 2021, tipo: 'intermedia', estado_tasa: 'rate_undefined' }, figures],
    vecinos: ['cvegeo:14120'],
  },
};

const fetcher = vi.fn(async (url: RequestInfo | URL) => {
  const body = files[String(url)];
  return body ? new Response(JSON.stringify(body)) : new Response('', { status: 404 });
});
const repo = new JsonTurnoutRepository(new JsonClient('/data', fetcher as typeof fetch));
const town = (code: number, name: string, key: string) =>
  municipality(14, code, name, 'Jalisco', key) as Extract<
    ReturnType<typeof municipality>,
    { level: 'municipality' }
  >;

describe('JsonTurnoutRepository', () => {
  it('maps the DTO to the domain, with the source of every figure (RN-10)', async () => {
    const series = await repo.series(NATIONAL);
    expect(series.status).toBe('published');
    if (series.status !== 'published') return;
    const [e2024] = series.elections;
    expect(e2024?.election).toEqual({ year: 2024, type: 'presidential' });
    expect(e2024?.total.source.name).toBe('INE (sintético)');
  });

  it('finds the files through the catalog and shows state names for people', async () => {
    const [jalisco] = await repo.states();
    expect(jalisco?.name).toBe('Jalisco');
    const towns = await repo.municipalities(14);
    expect(towns.map((t) => t.level === 'municipality' && t.key)).toEqual([
      'cvegeo:14039',
      'cvegeo:14117',
    ]);
  });

  it('marks a municipality without any figure as suppressed (RN-05)', async () => {
    expect((await repo.series(town(117, 'X', 'cvegeo:14117'))).status).toBe('suppressed');
  });

  it('keeps the elections that have a rate and reads neighbours by key', async () => {
    const gdl = town(39, 'Guadalajara', 'cvegeo:14039');
    const series = await repo.series(gdl);
    expect(series.status === 'published' && series.elections.map((e) => e.election.year)).toEqual([
      2024,
    ]);
    expect((await repo.municipalityProfile(gdl)).neighbours).toEqual(['cvegeo:14120']);
  });

  it('translates a missing file into DataUnavailable (W-17)', async () => {
    const empty = new JsonTurnoutRepository(
      new JsonClient('/data', (async () => new Response('', { status: 404 })) as typeof fetch),
    );
    await expect(empty.states()).rejects.toBeInstanceOf(DataUnavailable);
  });
});
