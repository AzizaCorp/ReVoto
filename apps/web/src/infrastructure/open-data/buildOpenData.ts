// Open data downloads (W-16, US-22): flat CSV and JSON tables derived at build time from the L4
// files in public/data. They hold the same figures the app shows, one row per territory and
// election, so people can open them in a spreadsheet. Only relative imports: vite.config.ts uses it.
import type {
  CifrasEleccionDto,
  DatosEntidadDto,
  DatosMunicipioDto,
  EntidadDto,
  SerieNacionalDto,
} from '@revoto/contracts';
import { stateName } from '../static-json/stateNames';

/** Folder under the data root where the downloads are published. */
export const DOWNLOADS_DIR = 'descargas';

export const DOWNLOADS = {
  turnout: 'participacion',
  ageSex: 'participacion_edad_sexo',
  archetypes: 'arquetipos_municipales',
} as const;
export type DownloadKey = keyof typeof DOWNLOADS;

type Cell = string | number | null;
type Row = Record<string, Cell>;

export interface Table {
  columns: readonly string[];
  rows: readonly Row[];
}

export interface OpenDataInput {
  national: SerieNacionalDto;
  states: readonly { entry: EntidadDto; data: DatosEntidadDto }[];
  municipalities: readonly DatosMunicipioDto[];
}

const PLACE = ['nivel', 'cve_entidad', 'entidad', 'cve_municipio', 'cvegeo', 'municipio'] as const;
const TURNOUT = [
  ...PLACE,
  'anio',
  'tipo',
  'lista_nominal',
  'participacion',
  'estado_tasa',
  'fuente',
] as const;
const AGE_SEX = [...PLACE, 'anio', 'tipo', 'desglose', 'grupo', 'participacion', 'fuente'] as const;
const ARCHETYPES = [
  'cve_entidad',
  'entidad',
  'cve_municipio',
  'cvegeo',
  'municipio',
  'arquetipo_id',
  'arquetipo',
  'nivel_pp',
  'efecto_presidencial_pp',
  'tendencia_pp_decada',
  'volatilidad_pp',
  'tipicidad',
  'rasgo',
] as const;

interface Place {
  nivel: string;
  cve_entidad: number | null;
  entidad: string | null;
  cve_municipio: number | null;
  cvegeo: string | null;
  municipio: string | null;
}

function turnoutRows(place: Place, elections: readonly CifrasEleccionDto[], source: string): Row[] {
  return elections.map((e) => ({
    ...place,
    anio: e.anio,
    tipo: e.tipo,
    lista_nominal: e.lista_nominal ?? null,
    participacion: 'participacion' in e ? e.participacion : null,
    estado_tasa: 'participacion' in e ? 'available' : e.estado_tasa,
    fuente: source,
  }));
}

function ageSexRows(place: Place, elections: readonly CifrasEleccionDto[], source: string): Row[] {
  return elections.flatMap((e) =>
    'participacion' in e
      ? [
          ...Object.entries(e.por_edad).map(([grupo, v]) => ['edad', grupo, v] as const),
          ...Object.entries(e.por_sexo).map(([grupo, v]) => ['sexo', grupo, v] as const),
        ].map(([desglose, grupo, v]) => ({
          ...place,
          anio: e.anio,
          tipo: e.tipo,
          desglose,
          grupo,
          participacion: v ?? null,
          fuente: source,
        }))
      : [],
  );
}

/** The three download tables, ordered by state, municipality and year. */
export function buildOpenData({
  national,
  states,
  municipalities,
}: OpenDataInput): Record<DownloadKey, Table> {
  const names = new Map(states.map((s) => [s.entry.cve, stateName(s.entry.cve, s.entry.nombre)]));
  const nationalPlace: Place = {
    nivel: 'nacional',
    cve_entidad: null,
    entidad: null,
    cve_municipio: null,
    cvegeo: null,
    municipio: null,
  };
  const statePlace = (cve: number): Place => ({
    ...nationalPlace,
    nivel: 'entidad',
    cve_entidad: cve,
    entidad: names.get(cve) ?? null,
    cvegeo: String(cve).padStart(2, '0'),
  });
  const sortedStates = [...states].sort((a, b) => a.entry.cve - b.entry.cve);
  const sortedMunicipalities = [...municipalities].sort(
    (a, b) =>
      (a.territorio.cveEntidad ?? 0) - (b.territorio.cveEntidad ?? 0) ||
      (a.territorio.cve ?? 0) - (b.territorio.cve ?? 0),
  );
  const municipalPlace = (m: DatosMunicipioDto): Place => ({
    nivel: 'municipio',
    cve_entidad: m.territorio.cveEntidad ?? null,
    entidad: names.get(m.territorio.cveEntidad ?? 0) ?? null,
    cve_municipio: m.territorio.cve ?? null,
    cvegeo: m.territorio.cvegeo ?? null,
    municipio: m.territorio.nombre,
  });

  const all = [
    { place: nationalPlace, elections: national.elecciones, source: national.fuente },
    ...sortedStates.map((s) => ({
      place: statePlace(s.entry.cve),
      elections: s.data.elecciones,
      source: s.data.fuente,
    })),
    ...sortedMunicipalities.map((m) => ({
      place: municipalPlace(m),
      elections: m.elecciones,
      source: m.fuente,
    })),
  ];

  return {
    turnout: {
      columns: TURNOUT,
      rows: all.flatMap((t) => turnoutRows(t.place, t.elections, t.source)),
    },
    ageSex: {
      columns: AGE_SEX,
      rows: all.flatMap((t) => ageSexRows(t.place, t.elections, t.source)),
    },
    archetypes: {
      columns: ARCHETYPES,
      rows: sortedMunicipalities.flatMap((m) => {
        const a = m.arquetipo;
        if (!a) return [];
        const p = municipalPlace(m);
        return [
          {
            cve_entidad: p.cve_entidad,
            entidad: p.entidad,
            cve_municipio: p.cve_municipio,
            cvegeo: p.cvegeo,
            municipio: p.municipio,
            arquetipo_id: a.id,
            arquetipo: a.nombre,
            nivel_pp: a.nivel,
            efecto_presidencial_pp: a.efecto_presidencial,
            tendencia_pp_decada: a.tendencia,
            volatilidad_pp: a.volatilidad,
            tipicidad: a.tipicidad,
            rasgo: a.rasgo,
          },
        ];
      }),
    },
  };
}

const BOM = String.fromCharCode(0xfeff);

const csvCell = (v: Cell) => {
  if (v === null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** RFC 4180 CSV with a UTF-8 BOM so spreadsheets read accents correctly. */
export function toCsv({ columns, rows }: Table): string {
  const lines = [
    columns.join(','),
    ...rows.map((r) => columns.map((c) => csvCell(r[c] ?? null)).join(',')),
  ];
  return `${BOM}${lines.join('\r\n')}\r\n`;
}

/** JSON array of records with the same columns as the CSV. */
export function toJson({ columns, rows }: Table): string {
  return JSON.stringify(rows.map((r) => Object.fromEntries(columns.map((c) => [c, r[c] ?? null]))));
}

/** Every download file: `{ "participacion.csv": "…", "participacion.json": "…", … }`. */
export function openDataFiles(input: OpenDataInput): Record<string, string> {
  const tables = buildOpenData(input);
  return Object.fromEntries(
    (Object.keys(DOWNLOADS) as DownloadKey[]).flatMap((k) => [
      [`${DOWNLOADS[k]}.csv`, toCsv(tables[k])],
      [`${DOWNLOADS[k]}.json`, toJson(tables[k])],
    ]),
  );
}
