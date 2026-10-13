// L4 contract DTO → domain model. The only place that knows both.
import {
  election,
  figure,
  proportion,
  type AgeGroup,
  type ElectionTurnout,
  type Proportion,
  type Sex,
  type Territory,
  type TurnoutSeries,
} from '@/domain';
import type { CifrasEleccionDto } from '@revoto/contracts';

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
