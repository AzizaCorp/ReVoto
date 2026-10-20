import type { MunicipalityProfile, StateOverview, TurnoutRepository } from '@/application';
import { municipality, state, type AgeGroup, type Territory, type TurnoutSeries } from '@/domain';
import type { DatosMunicipioDto, SerieNacionalDto } from '@revoto/contracts';
import { JsonClient } from './JsonClient';
import { StateFiles, municipalityKey } from './StateFiles';
import { toArchetype, toMunicipalitySummary, toSeries } from './mappers';
import { stateName } from './stateNames';

type Municipality = Extract<Territory, { level: 'municipality' }>;

/** Adapter of the TurnoutRepository port over the static JSON files on the CDN (ADR-0001). */
export class JsonTurnoutRepository implements TurnoutRepository {
  constructor(
    private readonly client = new JsonClient(),
    private readonly files = new StateFiles(client),
  ) {}

  async states(): Promise<Territory[]> {
    return (await this.files.catalog()).map((e) => state(e.cve, stateName(e.cve, e.nombre)));
  }

  async municipalities(stateCode: number): Promise<Territory[]> {
    const data = await this.files.state(stateCode);
    const name = stateName(stateCode, data.territorio.nombre);
    // Without a CVEGEO (verified or candidate) the pipeline could not place the municipality on
    // the territory and does not publish its file: it is not offered as a choice.
    return data.municipios
      .filter((m) => m.cvegeo ?? m.cvegeo_candidato)
      .map((m) => municipality(stateCode, m.cve, m.nombre, name, municipalityKey(stateCode, m)))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async series(t: Territory): Promise<TurnoutSeries> {
    switch (t.level) {
      case 'national': {
        const d = await this.client.read<SerieNacionalDto>('nacional.json');
        return toSeries(t, d.fuente, d.elecciones);
      }
      case 'state': {
        const d = await this.files.state(t.stateCode);
        return toSeries(t, d.fuente, d.elecciones);
      }
      case 'municipality': {
        const d = await this.municipalityFile(t);
        // RN-05 is applied per election: suppressed only if no election has a figure.
        return d.suprimido || !d.elecciones.some((e) => 'participacion' in e)
          ? { status: 'suppressed', territory: t, reason: 'threshold-rn05' }
          : toSeries(t, d.fuente, d.elecciones);
      }
    }
  }

  async stateOverview(stateCode: number): Promise<StateOverview> {
    const d = await this.files.state(stateCode);
    const name = stateName(stateCode, d.territorio.nombre);
    return {
      state: state(stateCode, name) as StateOverview['state'],
      municipalities: d.municipios.map((m) => toMunicipalitySummary(stateCode, name, m)),
      expectedVotes: { ...d.votos_esperados_por_edad } as Partial<Record<AgeGroup, number>>,
    };
  }

  async municipalityProfile(m: Municipality): Promise<MunicipalityProfile> {
    const d = await this.municipalityFile(m);
    const code = d.territorio.cvegeo ?? d.territorio.cvegeo_candidato;
    return {
      ...(code ? { inegiCode: code } : {}),
      // `vecinos` are id_operativo values, the same identity as Territory.key.
      neighbours: d.vecinos ?? [],
      archetype: d.arquetipo && !d.suprimido ? toArchetype(d.arquetipo) : null,
    };
  }

  private async municipalityFile(m: Municipality): Promise<DatosMunicipioDto> {
    return this.client.read<DatosMunicipioDto>(await this.files.municipalityPath(m));
  }
}
