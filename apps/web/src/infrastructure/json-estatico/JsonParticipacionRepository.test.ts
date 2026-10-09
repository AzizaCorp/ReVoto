import { DatosNoDisponibles } from '@/application';
import { municipio, NACIONAL } from '@/domain';
import { ClienteJson } from './ClienteJson';
import { JsonParticipacionRepository } from './JsonParticipacionRepository';

const VERSION = '20261012-a1b2c3d';
const cifras = {
  anio: 2024,
  tipo: 'presidencial',
  participacion: 0.597,
  lista_nominal: 98330348,
  por_edad: { '18-24': 0.55 },
  por_sexo: { M: 0.62 },
};
const archivos: Record<string, unknown> = {
  '/data/manifest.json': {
    version_datos: VERSION,
    generado: '',
    fuente: 'x',
    validacion: { max_diferencia_pp: 0, reporte: '' },
  },
  [`/data/${VERSION}/nacional.json`]: {
    territorio: { nivel: 'nacional', nombre: 'Nacional' },
    fuente: 'INE (sintético)',
    elecciones: [cifras],
  },
  [`/data/${VERSION}/municipio/14-117.json`]: {
    territorio: { nivel: 'municipio', nombre: 'X' },
    fuente: 'INE',
    suprimido: true,
    elecciones: [],
  },
};

const fetcher = vi.fn(async (url: RequestInfo | URL) => {
  const cuerpo = archivos[String(url)];
  return cuerpo ? new Response(JSON.stringify(cuerpo)) : new Response('', { status: 404 });
});
const repo = new JsonParticipacionRepository(new ClienteJson('/data', fetcher as typeof fetch));

describe('JsonParticipacionRepository', () => {
  it('lee la versión vigente del manifiesto y traduce el DTO al dominio', async () => {
    const serie = await repo.serie(NACIONAL);
    expect(serie.estado).toBe('publicada');
    if (serie.estado !== 'publicada') return;
    const [e2024] = serie.elecciones;
    expect(e2024?.eleccion).toEqual({ anio: 2024, tipo: 'presidencial' });
    expect(e2024?.total.fuente.nombre).toBe('INE (sintético)'); // RN-10
    expect(fetcher).toHaveBeenCalledWith('/data/manifest.json', { cache: 'no-cache' });
  });

  it('marca como suprimido un municipio bajo el umbral (RN-05)', async () => {
    const serie = await repo.serie(municipio(14, 117, 'X', 'Jalisco'));
    expect(serie.estado).toBe('suprimida');
  });

  it('traduce un archivo faltante a DatosNoDisponibles (W-17)', async () => {
    await expect(repo.entidades()).rejects.toBeInstanceOf(DatosNoDisponibles);
  });
});
