import type { GeographyRepository, MapLayer, StateTurnoutPoint } from '@/application';
import { isElectionYear, proportion, type ElectionYear, type Proportion } from '@/domain';
import type { TopologiaDto } from '@revoto/contracts';
import { JsonClient } from './JsonClient';
import { StateFiles, municipalityKey } from './StateFiles';
import { stateName } from './stateNames';
import { toLayer } from './topology';

/**
 * Adapter of the GeographyRepository port over geo/entidades.topo.json, geo/<slug>.topo.json
 * (one per state, areas keyed by CVEGEO) and the state files for names and turnout.
 */
export class JsonGeographyRepository implements GeographyRepository {
  private readonly layers = new Map<string, Promise<MapLayer>>();

  constructor(
    private readonly client = new JsonClient(),
    private readonly files = new StateFiles(client),
  ) {}

  private layer(path: string, build: (t: TopologiaDto) => MapLayer | Promise<MapLayer>) {
    let p = this.layers.get(path);
    if (!p) {
      p = this.client.read<TopologiaDto>(path).then(build);
      this.layers.set(path, p);
    }
    return p;
  }

  async states(): Promise<MapLayer> {
    const manifest = await this.client.currentVersion();
    const path = manifest?.topologia?.entidades ?? 'geo/entidades.topo.json';
    return this.layer(path, (t) =>
      toLayer(t, (p) => {
        const code = Number(p.cvegeo ?? p.cve);
        return { id: String(code), name: stateName(code, p.nombre ?? '') };
      }),
    );
  }

  async municipalities(stateCode: number): Promise<MapLayer> {
    const manifest = await this.client.currentVersion();
    const two = String(stateCode).padStart(2, '0');
    const path =
      manifest?.topologia?.por_entidad[two] ?? `geo/${await this.files.slug(stateCode)}.topo.json`;
    return this.layer(path, async (t) => {
      // Areas come keyed by CVEGEO; the app knows municipalities by key (id_operativo).
      const byCode = new Map<string, { id: string; name: string }>();
      for (const m of (await this.files.state(stateCode)).municipios) {
        const code = m.cvegeo ?? m.cvegeo_candidato;
        if (code) byCode.set(code, { id: municipalityKey(stateCode, m), name: m.nombre });
      }
      return toLayer(t, (p) => {
        const code = p.cvegeo ?? '';
        return byCode.get(code) ?? { id: code, name: p.nombre ?? '' };
      });
    });
  }

  async statesTurnout(): Promise<ReadonlyMap<number, StateTurnoutPoint>> {
    const catalog = await this.files.catalog();
    const entries = await Promise.all(
      catalog.map(async (e) => {
        const d = await this.files.state(e.cve);
        const turnout: Partial<Record<ElectionYear, Proportion>> = {};
        for (const el of d.elecciones) {
          if ('participacion' in el && isElectionYear(el.anio)) {
            turnout[el.anio] = proportion(el.participacion);
          }
        }
        return [e.cve, { name: stateName(e.cve, e.nombre), turnout }] as const;
      }),
    );
    return new Map(entries);
  }
}
