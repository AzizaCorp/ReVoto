import { DataUnavailable } from '@/application';
import type { Territory } from '@/domain';
import type { DatosEntidadDto, EntidadDto, ResumenMunicipioDto } from '@revoto/contracts';
import { JsonClient } from './JsonClient';

type Municipality = Extract<Territory, { level: 'municipality' }>;

/** Unique key of a municipality: the pipeline's identity, or «state-key» if it has none. */
export const municipalityKey = (stateCode: number, m: ResumenMunicipioDto): string =>
  m.id_operativo ?? `${stateCode}-${m.cve}`;

/**
 * Finds the files of the contract from the catalog: catalogos/entidades.json lists each state with
 * its `archivo`, and each state file lists its municipalities with theirs. Shared by the
 * repositories so every file is requested once per visit.
 */
export class StateFiles {
  constructor(private readonly client = new JsonClient()) {}

  catalog(): Promise<EntidadDto[]> {
    return this.client.read<EntidadDto[]>('catalogos/entidades.json');
  }

  /** Path of the state file, `entidad/<slug>.json`. */
  async statePath(stateCode: number): Promise<string> {
    const entry = (await this.catalog()).find((e) => e.cve === stateCode);
    if (!entry) throw new DataUnavailable(`entidad ${stateCode}`, 'not-found');
    return entry.archivo ?? `entidad/${String(stateCode).padStart(2, '0')}.json`;
  }

  async state(stateCode: number): Promise<DatosEntidadDto> {
    return this.client.read<DatosEntidadDto>(await this.statePath(stateCode));
  }

  /** `<slug>` of the state, shared by entidad/<slug>.json and geo/<slug>.topo.json. */
  async slug(stateCode: number): Promise<string> {
    return (await this.statePath(stateCode)).replace(/^entidad\//, '').replace(/\.json$/, '');
  }

  /** The municipality's entry in its state file, by key (falls back to a unique INE key). */
  async entry(m: Municipality): Promise<ResumenMunicipioDto> {
    const list = (await this.state(m.stateCode)).municipios;
    const found =
      list.find((x) => municipalityKey(m.stateCode, x) === m.key) ??
      (list.filter((x) => x.cve === m.municipalityCode).length === 1
        ? list.find((x) => x.cve === m.municipalityCode)
        : undefined);
    if (!found) throw new DataUnavailable(`municipio ${m.key}`, 'not-found');
    return found;
  }

  /** Path of the municipality file, from its `archivo`. */
  async municipalityPath(m: Municipality): Promise<string> {
    const e = await this.entry(m);
    return (
      e.archivo ??
      `municipio/${String(m.stateCode).padStart(2, '0')}-${String(e.cve).padStart(3, '0')}.json`
    );
  }
}
