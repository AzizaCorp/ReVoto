import type { ParticipacionRepository } from '@/application';
import { entidad, municipio, type SerieParticipacion, type Territorio } from '@/domain';
import type {
  DatosEntidadDto,
  DatosMunicipioDto,
  EntidadDto,
  SerieNacionalDto,
} from '@revoto/contracts';
import { ClienteJson } from './ClienteJson';
import { aSerie } from './mapeadores';

/** Adaptador del puerto ParticipacionRepository sobre los JSON estáticos del CDN (ADR-0001). */
export class JsonParticipacionRepository implements ParticipacionRepository {
  constructor(private readonly cliente = new ClienteJson()) {}

  async entidades(): Promise<Territorio[]> {
    const lista = await this.cliente.leer<EntidadDto[]>('catalogos/entidades.json');
    return lista.map((e) => entidad(e.cve, e.nombre));
  }

  async municipios(cveEntidad: number): Promise<Territorio[]> {
    const datos = await this.cliente.leer<DatosEntidadDto>(`entidad/${cveEntidad}.json`);
    return datos.municipios.map((m) =>
      municipio(cveEntidad, m.cve, m.nombre, datos.territorio.nombre),
    );
  }

  async serie(t: Territorio): Promise<SerieParticipacion> {
    switch (t.nivel) {
      case 'nacional': {
        const d = await this.cliente.leer<SerieNacionalDto>('nacional.json');
        return aSerie(t, d.fuente, d.elecciones);
      }
      case 'entidad': {
        const d = await this.cliente.leer<DatosEntidadDto>(`entidad/${t.cveEntidad}.json`);
        return aSerie(t, d.fuente, d.elecciones);
      }
      case 'municipio': {
        const mun = String(t.cveMunicipio).padStart(3, '0');
        const d = await this.cliente.leer<DatosMunicipioDto>(
          `municipio/${t.cveEntidad}-${mun}.json`,
        );
        return d.suprimido
          ? { estado: 'suprimida', territorio: t, motivo: 'umbral-rn05' }
          : aSerie(t, d.fuente, d.elecciones);
      }
    }
  }
}
