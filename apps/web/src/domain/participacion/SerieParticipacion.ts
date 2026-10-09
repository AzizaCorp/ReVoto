import type { Eleccion } from '../eleccion';
import type { Territorio } from '../territorio';
import type { Cifra, Fuente } from './Cifra';
import type { GrupoEdad } from './GrupoEdad';
import type { Proporcion } from './Proporcion';
import type { Sexo } from './Sexo';

export interface ParticipacionEnEleccion {
  readonly eleccion: Eleccion;
  readonly total: Cifra;
  readonly listaNominal: number;
  readonly porEdad: Partial<Record<GrupoEdad, Proporcion>>;
  readonly porSexo: Partial<Record<Sexo, Proporcion>>;
}

/**
 * Resultado de consultar un territorio. RN-05: si su lista nominal no alcanza el umbral,
 * no trae cifras y la app debe mostrar el territorio superior con una nota.
 */
export type SerieParticipacion =
  | {
      readonly estado: 'publicada';
      readonly territorio: Territorio;
      readonly fuente: Fuente;
      readonly elecciones: readonly ParticipacionEnEleccion[];
    }
  | {
      readonly estado: 'suprimida';
      readonly territorio: Territorio;
      readonly motivo: 'umbral-rn05';
    };
