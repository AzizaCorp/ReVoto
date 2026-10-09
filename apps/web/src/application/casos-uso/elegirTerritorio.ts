import type { Territorio } from '@/domain';
import type { ParticipacionRepository } from '../ports/ParticipacionRepository';

/** W-02 · Opciones del selector: 32 entidades y, al elegir una, sus municipios (HU-28). */
export function listarEntidades(repo: ParticipacionRepository): Promise<Territorio[]> {
  return repo.entidades();
}

export function listarMunicipios(
  repo: ParticipacionRepository,
  cveEntidad: number,
): Promise<Territorio[]> {
  return repo.municipios(cveEntidad);
}
