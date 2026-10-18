// L4 contract DTO → domain model. The only place that knows both.
import {
  election,
  figure,
  isElectionYear,
  municipality,
  proportion,
  type AgeGroup,
  type ArchetypeProfile,
  type ArchetypeTrait,
  type ElectionTurnout,
  type ElectionYear,
  type Proportion,
  type QualityReport,
  type Sex,
  type Territory,
  type TurnoutSeries,
} from '@/domain';
import type { MunicipalitySummary } from '@/application';
import type {
  ArquetipoDto,
  CalidadDto,
  CifrasEleccionDto,
  CifrasPublicadasDto,
  ManifiestoDto,
  ResumenMunicipioDto,
} from '@revoto/contracts';
import { municipalityKey } from './StateFiles';

/** An election without `participacion` (RN-05 or no denominator) has no figure to show. */
const published = (e: CifrasEleccionDto): e is CifrasPublicadasDto => 'participacion' in e;

const toProportions = <K extends string>(r: Partial<Record<K, number>>) =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [k, proportion(v as number)])) as Partial<
    Record<K, Proportion>
  >;

export function toSeries(
  territory: Territory,
  sourceName: string,
  elections: CifrasEleccionDto[],
): TurnoutSeries {
  const source = { name: sourceName };
  return {
    status: 'published',
    territory,
    source,
    elections: elections.filter(published).map((e): ElectionTurnout => {
      const el = election(e.anio);
      return {
        election: el,
        total: figure(proportion(e.participacion), territory, el, source),
        registeredVoters: e.lista_nominal,
        byAge: toProportions<AgeGroup>(e.por_edad),
        bySex: toProportions<Sex>(e.por_sexo),
      };
    }),
  };
}

export function toMunicipalitySummary(
  stateCode: number,
  stateName: string,
  m: ResumenMunicipioDto,
): MunicipalitySummary {
  const turnout: Partial<Record<ElectionYear, Proportion>> = {};
  for (const [year, value] of Object.entries(m.participacion ?? {})) {
    const y = Number(year);
    if (isElectionYear(y) && value !== undefined) turnout[y] = proportion(value);
  }
  return {
    municipality: municipality(
      stateCode,
      m.cve,
      m.nombre,
      stateName,
      municipalityKey(stateCode, m),
    ) as Extract<Territory, { level: 'municipality' }>,
    ...(m.cvegeo || m.cvegeo_candidato ? { inegiCode: m.cvegeo ?? m.cvegeo_candidato } : {}),
    suppressed: m.suprimido === true,
    turnout,
  };
}

const TRAIT: Record<ArquetipoDto['rasgo'], ArchetypeTrait> = {
  nivel: 'level',
  efp: 'presidential-effect',
  tend: 'trend',
  vol: 'volatility',
};

export const toArchetype = (a: ArquetipoDto): ArchetypeProfile => ({
  archetype: a.id,
  level: a.nivel,
  presidentialEffect: a.efecto_presidencial,
  trend: a.tendencia,
  volatility: a.volatilidad,
  typicality: a.tipicidad,
  trait: TRAIT[a.rasgo],
});

type Check = QualityReport['checks'][number];
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);

/** calidad.json of the pipeline (export/exportar_ine_exploratorio.py) → the checks of W-20. */
function qualityChecks(c: CalidadDto): Check[] {
  const official = obj(c.oficial);
  const coverage = obj(c.cobertura);
  const integrity = obj(c.integridad);
  const errors = Object.keys(obj(obj(c.geometria).errores));
  const pendingIds = num(coverage.identidades_pendientes) ?? 0;
  const officialState = String(official.estado ?? 'no_verificada');
  return [
    {
      id: 'RF-23',
      description: 'Diferencia contra cifras oficiales del INE ≤ 1 punto',
      result:
        officialState === 'validada'
          ? 'passed'
          : officialState === 'fallida'
            ? 'failed'
            : 'pending',
      detail:
        num(official.max_diferencia_pp) !== null
          ? `Diferencia máxima: ${num(official.max_diferencia_pp)} pp`
          : String(official.motivo ?? 'Sin cifras oficiales para comparar'),
    },
    {
      id: 'RN-05',
      description: 'Elecciones bajo el umbral suprimidas',
      result: 'passed',
      detail: `${num(coverage.elecciones_suprimidas_rn05) ?? 0} elecciones municipales suprimidas`,
    },
    {
      id: 'RF-24',
      description: 'Documentos validados contra el contrato L4',
      result: integrity.estado === 'verificada' ? 'passed' : 'pending',
      detail: `${num(integrity.documentos_validados) ?? 0} documentos validados`,
    },
    {
      id: 'Territorio',
      description: 'Equivalencia INE → INEGI de cada municipio',
      result: pendingIds === 0 ? 'passed' : 'pending',
      detail: `${num(coverage.identidades_verificadas) ?? 0} verificadas, ${pendingIds} pendientes`,
    },
    {
      id: 'Geometría',
      description: 'Mapas de las 32 entidades',
      result: errors.length === 0 ? 'passed' : 'failed',
      detail: errors.length === 0 ? 'Sin errores' : `Con errores: ${errors.join(', ')}`,
    },
  ];
}

/** W-20 · Manifest and calidad.json are optional: without them every check stays pending. */
export const toQualityReport = (
  m: ManifiestoDto | null,
  c: CalidadDto | null,
  source: string,
): QualityReport => ({
  version: m?.version_datos ?? 'Sin versión publicada',
  generatedAt: m?.generado ?? '',
  source: m?.fuente ?? source,
  maxDifferencePoints:
    m?.validacion?.max_diferencia_pp ??
    m?.max_diferencia_pp ??
    num(obj(c?.oficial).max_diferencia_pp) ??
    null,
  checks: c ? qualityChecks(c) : [],
});
