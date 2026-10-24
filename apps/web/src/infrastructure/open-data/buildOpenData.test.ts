import { join } from 'node:path';
import type { DatosMunicipioDto, SerieNacionalDto } from '@revoto/contracts';
import { hasRealData } from '@/test/realData';
import { buildOpenData, openDataFiles, toCsv } from './buildOpenData';
import { readOpenDataInput } from './vitePlugin';

const national: SerieNacionalDto = {
  territorio: { nivel: 'nacional', nombre: 'Nacional' },
  fuente: 'INE · CCPC',
  elecciones: [
    {
      anio: 2024,
      tipo: 'presidencial',
      participacion: 0.597,
      lista_nominal: 98330348,
      por_edad: { '18-24': 0.504 },
      por_sexo: { H: 0.56, M: 0.63 },
    },
  ],
};
const town: DatosMunicipioDto = {
  territorio: {
    nivel: 'municipio',
    nombre: 'Acatic, "centro"',
    cve: 1,
    cveEntidad: 14,
    cvegeo: '14001',
  },
  fuente: 'INE · CCPC',
  suprimido: false,
  elecciones: [
    { anio: 2015, tipo: 'intermedia', estado_tasa: 'rate_undefined', lista_nominal: 10 },
  ],
  arquetipo: {
    id: 'A4',
    nombre: 'De elección grande',
    nivel: -4.59,
    efecto_presidencial: 3.525,
    tendencia: -0.927,
    volatilidad: 3.909,
    tipicidad: 0.8,
    rasgo: 'efp',
  },
};
const input = {
  national,
  states: [
    {
      entry: { cve: 14, nombre: 'JALISCO', archivo: 'entidad/jalisco.json' },
      data: {
        territorio: { nivel: 'entidad' as const, nombre: 'JALISCO', cve: 14 },
        fuente: 'INE · CCPC',
        elecciones: [],
        municipios: [],
      },
    },
  ],
  municipalities: [town],
};

describe('Open data downloads (W-16)', () => {
  it('flattens turnout, age and sex, and archetypes with the place of every row', () => {
    const t = buildOpenData(input);
    expect(t.turnout.rows).toEqual([
      expect.objectContaining({
        nivel: 'nacional',
        anio: 2024,
        participacion: 0.597,
        estado_tasa: 'available',
      }),
      expect.objectContaining({
        nivel: 'municipio',
        entidad: 'Jalisco',
        cvegeo: '14001',
        participacion: null,
        estado_tasa: 'rate_undefined',
      }),
    ]);
    expect(t.ageSex.rows.map((r) => [r.desglose, r.grupo])).toEqual([
      ['edad', '18-24'],
      ['sexo', 'H'],
      ['sexo', 'M'],
    ]);
    expect(t.archetypes.rows[0]).toMatchObject({
      arquetipo_id: 'A4',
      nivel_pp: -4.59,
      tipicidad: 0.8,
    });
  });

  it('writes RFC 4180 CSV with a BOM and empty cells for missing values', () => {
    const csv = toCsv(buildOpenData(input).turnout);
    const [head, , town] = csv.replace('\uFEFF', '').split('\r\n');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(head).toBe(
      'nivel,cve_entidad,entidad,cve_municipio,cvegeo,municipio,anio,tipo,lista_nominal,participacion,estado_tasa,fuente',
    );
    expect(town).toBe(
      'municipio,14,Jalisco,1,14001,"Acatic, ""centro""",2015,intermedia,10,,rate_undefined,INE · CCPC',
    );
  });

  it('publishes a CSV and a JSON for each table', () => {
    expect(Object.keys(openDataFiles(input)).sort()).toEqual([
      'arquetipos_municipales.csv',
      'arquetipos_municipales.json',
      'participacion.csv',
      'participacion.json',
      'participacion_edad_sexo.csv',
      'participacion_edad_sexo.json',
    ]);
  });

  it.runIf(hasRealData)('covers the whole published copy', () => {
    const data = readOpenDataInput(join(process.cwd(), 'public', 'data'))!;
    const t = buildOpenData(data);
    const levels = (lvl: string) => t.turnout.rows.filter((r) => r.nivel === lvl).length;
    expect(levels('nacional')).toBe(6);
    expect(levels('entidad')).toBe(32 * 6);
    expect(
      new Set(
        t.turnout.rows
          .filter((r) => r.nivel === 'municipio')
          .map((r) => `${r.cve_entidad}-${r.cve_municipio}`),
      ).size,
    ).toBe(2450); // San Felipe (02007) has a file but its state does not list it
    expect(t.archetypes.rows).toHaveLength(2415);
    const national2024 = t.turnout.rows.find((r) => r.nivel === 'nacional' && r.anio === 2024);
    expect(national2024).toMatchObject({ participacion: 0.597, lista_nominal: 98330348 });
  });
});
