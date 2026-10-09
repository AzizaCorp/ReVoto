import {
  NACIONAL,
  cifra,
  eleccion,
  entidad,
  municipio,
  proporcion,
  type SerieParticipacion,
  type Territorio,
} from '@/domain';
import type { ParticipacionRepository } from '../ports/ParticipacionRepository';
import { consultarParticipacion } from './consultarParticipacion';

const fuente = { nombre: 'Datos sintéticos de prueba' };
const publicada = (t: Territorio): SerieParticipacion => ({
  estado: 'publicada',
  territorio: t,
  fuente,
  elecciones: [
    {
      eleccion: eleccion(2024),
      total: cifra(proporcion(0.6), t, eleccion(2024), fuente),
      listaNominal: 1000,
      porEdad: {},
      porSexo: {},
    },
  ],
});

const repoFalso = (suprimidos: Territorio['nivel'][]): ParticipacionRepository => ({
  entidades: async () => [],
  municipios: async () => [],
  serie: async (t) =>
    suprimidos.includes(t.nivel)
      ? { estado: 'suprimida', territorio: t, motivo: 'umbral-rn05' }
      : publicada(t),
});

describe('consultarParticipacion (CU-02)', () => {
  const pequeño = municipio(14, 117, 'Municipio pequeño', 'Jalisco');

  it('regresa la serie del territorio cuando está publicada', async () => {
    const r = await consultarParticipacion(repoFalso([]), pequeño);
    expect(r.serie.territorio).toEqual(pequeño);
    expect(r.aviso).toBeUndefined();
  });

  it('RN-05: si el municipio no alcanza el umbral, muestra la entidad con aviso', async () => {
    const r = await consultarParticipacion(repoFalso(['municipio']), pequeño);
    expect(r.serie.territorio).toEqual(entidad(14, 'Jalisco'));
    expect(r.aviso).toBe('umbral-rn05');
    expect(r.solicitado).toEqual(pequeño);
  });

  it('el nivel nacional responde directamente', async () => {
    const r = await consultarParticipacion(repoFalso([]), NACIONAL);
    expect(r.serie.territorio).toBe(NACIONAL);
  });
});
