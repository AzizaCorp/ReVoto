import type { GeographyRepository, MapLayer, MunicipalTurnoutPoint } from '@/application';
import { isElectionYear, proportion, type ElectionYear, type Proportion } from '@/domain';
import type { MapaParticipacionDto, TopologiaDto } from '@revoto/contracts';
import { JsonClient } from './JsonClient';
import { toLayer } from './topology';

/** Adapter of the GeographyRepository port over geo/*.topo.json and mapa/participacion.json. */
export class JsonGeographyRepository implements GeographyRepository {
  private readonly layers = new Map<string, Promise<MapLayer>>();

  constructor(private readonly client = new JsonClient()) {}

  private layer(path: string, idOf: Parameters<typeof toLayer>[1]): Promise<MapLayer> {
    let p = this.layers.get(path);
    if (!p) {
      p = this.client.read<TopologiaDto>(path).then((t) => toLayer(t, idOf));
      this.layers.set(path, p);
    }
    return p;
  }

  states(): Promise<MapLayer> {
    return this.layer('geo/entidades.topo.json', (p) => String(p.cve));
  }

  municipalities(stateCode: number): Promise<MapLayer> {
    return this.layer(`geo/${stateCode}.topo.json`, (p) => String(p.cve ?? p.cvegeo));
  }

  country(): Promise<MapLayer> {
    return this.layer('geo/municipios.topo.json', (p) => p.cvegeo ?? '');
  }

  async countryTurnout(): Promise<ReadonlyMap<string, MunicipalTurnoutPoint>> {
    const d = await this.client.read<MapaParticipacionDto>('mapa/participacion.json');
    const years = d.anios.filter(isElectionYear);
    const map = new Map<string, MunicipalTurnoutPoint>();
    for (const [cvegeo, [name, stateCode, values]] of Object.entries(d.municipios)) {
      const turnout: Partial<Record<ElectionYear, Proportion>> = {};
      values.forEach((v, i) => {
        const year = years[i];
        if (year !== undefined && v !== null) turnout[year] = proportion(v);
      });
      map.set(cvegeo, { name, stateCode, turnout });
    }
    return map;
  }
}
