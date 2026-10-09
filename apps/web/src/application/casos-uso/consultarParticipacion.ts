import { territorioSuperior, type SerieParticipacion, type Territorio } from '@/domain';
import type { ParticipacionRepository } from '../ports/ParticipacionRepository';

export interface ResultadoConsulta {
  /** Territorio que eligió la persona. */
  readonly solicitado: Territorio;
  /** Serie que se muestra: la del solicitado o, si no alcanza el umbral, la del superior. */
  readonly serie: Extract<SerieParticipacion, { estado: 'publicada' }>;
  /** Presente cuando se elevó de nivel (RN-05, CU-02 A2): la UI muestra la nota explicativa. */
  readonly aviso?: 'umbral-rn05';
}

/**
 * CU-02 · Consultar la participación de un territorio.
 * Si el territorio no alcanza el umbral de publicación, sube al nivel superior hasta encontrar
 * una serie publicada y lo indica con `aviso`.
 */
export async function consultarParticipacion(
  repo: ParticipacionRepository,
  solicitado: Territorio,
): Promise<ResultadoConsulta> {
  let actual: Territorio | null = solicitado;
  let elevado = false;
  while (actual) {
    const serie = await repo.serie(actual);
    if (serie.estado === 'publicada') {
      return elevado ? { solicitado, serie, aviso: 'umbral-rn05' } : { solicitado, serie };
    }
    actual = territorioSuperior(actual);
    elevado = true;
  }
  throw new Error('RN-05: el nivel nacional siempre debe estar publicado');
}
