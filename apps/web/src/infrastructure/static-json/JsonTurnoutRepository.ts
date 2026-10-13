import type { TurnoutRepository } from '@/application';
import { municipality, state, type Territory, type TurnoutSeries } from '@/domain';
import type {
  DatosEntidadDto,
  DatosMunicipioDto,
  EntidadDto,
  SerieNacionalDto,
} from '@revoto/contracts';
import { JsonClient } from './JsonClient';
import { toSeries } from './mappers';

/** Adapter of the TurnoutRepository port over the static JSON files on the CDN (ADR-0001). */
export class JsonTurnoutRepository implements TurnoutRepository {
  constructor(private readonly client = new JsonClient()) {}

  async states(): Promise<Territory[]> {
    const list = await this.client.read<EntidadDto[]>('catalogos/entidades.json');
    return list.map((e) => state(e.cve, e.nombre));
  }

  async municipalities(stateCode: number): Promise<Territory[]> {
    const data = await this.client.read<DatosEntidadDto>(`entidad/${stateCode}.json`);
    return data.municipios.map((m) =>
      municipality(stateCode, m.cve, m.nombre, data.territorio.nombre),
    );
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
        const code = String(t.municipalityCode).padStart(3, '0');
        const d = await this.client.read<DatosMunicipioDto>(
          `municipio/${t.stateCode}-${code}.json`,
        );
        return d.suprimido
          ? { status: 'suppressed', territory: t, reason: 'threshold-rn05' }
          : toSeries(t, d.fuente, d.elecciones);
      }
    }
  }
}
