import type { MunicipalityProfile, StateOverview, TurnoutRepository } from '@/application';
import { municipality, state, type AgeGroup, type Territory, type TurnoutSeries } from '@/domain';
import type {
  DatosEntidadDto,
  DatosMunicipioDto,
  EntidadDto,
  SerieNacionalDto,
} from '@revoto/contracts';
import { JsonClient } from './JsonClient';
import { toArchetype, toMunicipalitySummary, toSeries } from './mappers';

type Municipality = Extract<Territory, { level: 'municipality' }>;

const municipalityPath = (stateCode: number, code: number) =>
  `municipio/${stateCode}-${String(code).padStart(3, '0')}.json`;

/** Adapter of the TurnoutRepository port over the static JSON files on the CDN (ADR-0001). */
export class JsonTurnoutRepository implements TurnoutRepository {
  constructor(private readonly client = new JsonClient()) {}

  async states(): Promise<Territory[]> {
    const list = await this.client.read<EntidadDto[]>('catalogos/entidades.json');
    return list.map((e) => state(e.cve, e.nombre));
  }

  async municipalities(stateCode: number): Promise<Territory[]> {
    const data = await this.client.read<DatosEntidadDto>(`entidad/${stateCode}.json`);
    return data.municipios
      .map((m) => municipality(stateCode, m.cve, m.nombre, data.territorio.nombre))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async series(t: Territory): Promise<TurnoutSeries> {
    switch (t.level) {
      case 'national': {
        const d = await this.client.read<SerieNacionalDto>('nacional.json');
        return toSeries(t, d.fuente, d.elecciones);
      }
      case 'state': {
        const d = await this.client.read<DatosEntidadDto>(`entidad/${t.stateCode}.json`);
        return toSeries(t, d.fuente, d.elecciones);
      }
      case 'municipality': {
        const d = await this.client.read<DatosMunicipioDto>(
          municipalityPath(t.stateCode, t.municipalityCode),
        );
        return d.suprimido
          ? { status: 'suppressed', territory: t, reason: 'threshold-rn05' }
          : toSeries(t, d.fuente, d.elecciones);
      }
    }
  }

  async stateOverview(stateCode: number): Promise<StateOverview> {
    const d = await this.client.read<DatosEntidadDto>(`entidad/${stateCode}.json`);
    const name = d.territorio.nombre;
    return {
      state: state(stateCode, name) as StateOverview['state'],
      municipalities: d.municipios.map((m) => toMunicipalitySummary(stateCode, name, m)),
      expectedVotes: { ...d.votos_esperados_por_edad } as Partial<Record<AgeGroup, number>>,
    };
  }

  async municipalityProfile(m: Municipality): Promise<MunicipalityProfile> {
    const d = await this.client.read<DatosMunicipioDto>(
      municipalityPath(m.stateCode, m.municipalityCode),
    );
    return {
      ...(d.cvegeo ? { inegiCode: d.cvegeo } : {}),
      neighbours: d.vecinos ?? [],
      archetype: d.arquetipo && !d.suprimido ? toArchetype(d.arquetipo) : null,
    };
  }
}
