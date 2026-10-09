import type { SerieParticipacion, Territorio } from '@/domain';

/**
 * Puerto de salida: lo que la aplicación necesita saber de los datos, sin importar de dónde vengan.
 * Hoy lo implementa infrastructure/json-estatico (JSON en el CDN). Si algún día hay backend,
 * se agrega otro adaptador con esta misma interfaz y nada más cambia (ADR-0001).
 */
export interface ParticipacionRepository {
  /** Las 32 entidades, para el selector de W-02. */
  entidades(): Promise<Territorio[]>;
  /** Municipios de una entidad, para el selector dependiente de W-02. */
  municipios(cveEntidad: number): Promise<Territorio[]>;
  /** Serie 2009–2024 de un territorio. Un municipio bajo el umbral regresa estado 'suprimida'. */
  serie(territorio: Territorio): Promise<SerieParticipacion>;
}
