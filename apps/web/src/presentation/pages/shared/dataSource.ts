/**
 * Facts about the data source and the published L4 copy, shared by W-11 (source), W-16 (open
 * data), W-18 (methodology), W-19 (dictionary) and W-20 (quality). Same text as the D06 data
 * dictionary in Notion (US-07: one source of truth). Update it together with D06 whenever a new
 * copy of `public/data/` is published; values in `manifest.json` / `calidad.json`, when they exist,
 * take precedence on screen.
 */

export const SOURCE = {
  name: 'INE · DECEYEC · Conteos censales de participación ciudadana',
  citation:
    'ReVoto (2026). Participación electoral federal 2009–2024, con datos de los Conteos censales de participación ciudadana del INE.',
  files: '192 archivos (32 entidades × 6 elecciones)',
  records: '54,872,712 registros',
  audited: '04/10/2026',
  geography: 'INEGI · Marco Geoestadístico (mapas, claves CVEGEO y vecinos)',
} as const;

/** The copy in `public/data/`. Without `manifest.json` there is no `version_datos`. */
export const DATA_COPY = {
  date: '18/10/2026',
  status: 'Exploratoria: el cotejo contra las cifras oficiales del INE está pendiente',
} as const;

/** RN-05: minimum nominal list to publish an aggregate. */
export const THRESHOLD = 50;

export interface ElectionFacts {
  year: number;
  type: 'Presidencial' | 'Intermedia';
  /** Election day: cut-off date of the census counts. */
  date: string;
  /** Share of the nominal list without turnout data (NS / LN), SRS §8.2. */
  noData: string;
  /** National turnout, RN-01. */
  turnout: string;
  /** Municipalities with a published rate, out of the 2,451 published files. */
  municipalities: string;
}

export const ELECTIONS: readonly ElectionFacts[] = [
  {
    year: 2009,
    type: 'Intermedia',
    date: '05/07/2009',
    noData: '2.41 %',
    turnout: '44.1 %',
    municipalities: '2,437',
  },
  {
    year: 2012,
    type: 'Presidencial',
    date: '01/07/2012',
    noData: '0.22 %',
    turnout: '62.1 %',
    municipalities: '2,440',
  },
  {
    year: 2015,
    type: 'Intermedia',
    date: '07/06/2015',
    noData: '6.13 %',
    turnout: '47.1 %',
    municipalities: '2,415',
  },
  {
    year: 2018,
    type: 'Presidencial',
    date: '01/07/2018',
    noData: '6.83 %',
    turnout: '62.4 %',
    municipalities: '2,431',
  },
  {
    year: 2021,
    type: 'Intermedia',
    date: '06/06/2021',
    noData: '4.32 %',
    turnout: '51.8 %',
    municipalities: '2,439',
  },
  {
    year: 2024,
    type: 'Presidencial',
    date: '02/06/2024',
    noData: '6.43 %',
    turnout: '59.7 %',
    municipalities: '2,439',
  },
];

export const electionDate = (year: number) => ELECTIONS.find((e) => e.year === year)?.date ?? null;

export interface QualityRule {
  id: string;
  rule: string;
  /** Records affected; «Pendiente» when the count is not registered yet. */
  affected: string;
  treatment: string;
}

/** Quality rules and the records they affected (RF-24, US-07 CA-02). D06 §6. */
export const QUALITY_RULES: readonly QualityRule[] = [
  {
    id: 'CAL-01',
    rule: 'Todas las columnas llegan como texto',
    affected: '18 de 18 columnas',
    treatment: 'Se convierten a su tipo',
  },
  {
    id: 'CAL-02',
    rule: 'La fecha de 2024 viene en otro formato',
    affected: '1 de 6 elecciones',
    treatment: 'Se normaliza a día/mes/año',
  },
  {
    id: 'CAL-03',
    rule: 'Edades fuera de 18 a 110 años',
    affected: 'Pendiente de registrar',
    treatment: 'Salen del desglose por edad',
  },
  {
    id: 'CAL-04',
    rule: 'Sexo fuera del catálogo',
    affected: '105 personas',
    treatment: 'Salen del desglose por sexo; cuentan en el total',
  },
  {
    id: 'CAL-05',
    rule: 'Distrito local vacío',
    affected: 'Por conciliar (20,912 o 44,154 registros)',
    treatment: 'Se admite vacío; no se usa',
  },
  {
    id: 'CAL-06',
    rule: 'Registros sin dato de participación',
    affected: '0.22 % a 6.83 % de la lista nominal',
    treatment: 'Salen del denominador',
  },
  {
    id: 'CAL-07',
    rule: 'Municipios que no existen en todas las elecciones',
    affected: '10 municipios',
    treatment: 'Se muestran solo sus años',
  },
  {
    id: 'threshold',
    rule: `Grupos de edad o sexo con menos de ${THRESHOLD} personas`,
    affected: '332 elecciones municipales con algún grupo de edad omitido y 11 con un sexo omitido',
    treatment: 'Se omite el grupo; el total se publica',
  },
  {
    id: 'Identidad',
    rule: 'Municipios sin clave INEGI conciliada',
    affected: '52 de 2,502',
    treatment: 'No se ofrecen para elegir',
  },
  {
    id: 'Tasa',
    rule: 'Toda la lista nominal sin dato (LN = NS)',
    affected: '71 elecciones municipales',
    treatment: 'Sin cifra de participación',
  },
];
