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

export interface AuditCheck {
  description: string;
  result: 'passed' | 'pending' | 'failed';
  detail: string;
}

/**
 * Quality audit of this copy (RPT-CALIDAD-DATOS-REVOTO, 23/10/2026). W-20 shows it while the copy
 * has no `calidad.json`; once the pipeline publishes one, its checks take precedence.
 */
export const AUDIT = {
  date: '23/10/2026',
  verdict:
    'Publicable como versión exploratoria. Falta el cotejo contra las cifras oficiales del INE para aprobarla.',
  checks: [
    {
      description: 'Conteos sin nulos, negativos, duplicados ni más votos que lista nominal',
      result: 'passed',
      detail: '0 incidencias en 706,806 registros revisados (Querétaro, 2009–2024)',
    },
    {
      description: 'Lista nominal = votaron + no votaron + sin dato',
      result: 'passed',
      detail: '16 de 16 municipios de Ciudad de México, 2024',
    },
    {
      description: 'Fórmula de participación: votaron ÷ (lista nominal − sin dato)',
      result: 'passed',
      detail:
        'La participación nacional coincide con la auditoría de la fuente en las 6 elecciones',
    },
    {
      description: 'Archivos conformes al contrato de datos',
      result: 'passed',
      detail: '2,518 archivos validados',
    },
    {
      description: 'Peso de los archivos por consulta',
      result: 'passed',
      detail: 'Máximo 200 KB por entidad y 276 KB por mapa; el límite es 300 KB',
    },
    {
      description: 'Diferencia contra las cifras oficiales del INE de 1 punto o menos',
      result: 'pending',
      detail: 'El cotejo aún no se ejecuta en esta copia',
    },
    {
      description: 'Reglas de calidad con sus registros afectados',
      result: 'pending',
      detail: '8 de 10 con conteo; faltan edades fuera de rango y distrito local vacío',
    },
    {
      description: 'Equivalencia de cada municipio entre INE e INEGI',
      result: 'pending',
      detail: '52 municipios sin clave INEGI y 1 archivo sin enlazar a su entidad',
    },
  ] as readonly AuditCheck[],
} as const;
