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
  ManifiestoDto,
  ResumenMunicipioDto,
} from '@revoto/contracts';

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
    elections: elections.map((e): ElectionTurnout => {
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
    municipality: municipality(stateCode, m.cve, m.nombre, stateName) as Extract<
      Territory,
      { level: 'municipality' }
    >,
    ...(m.cvegeo ? { inegiCode: m.cvegeo } : {}),
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

const RESULT = { aprobada: 'passed', fallida: 'failed', pendiente: 'pending' } as const;

export const toQualityReport = (m: ManifiestoDto, c: CalidadDto): QualityReport => ({
  version: m.version_datos,
  generatedAt: m.generado,
  source: c.fuente,
  maxDifferencePoints: m.validacion.max_diferencia_pp,
  checks: c.reglas.map((r) => ({
    id: r.id,
    description: r.descripcion,
    result: RESULT[r.resultado],
    detail: r.detalle,
  })),
});
