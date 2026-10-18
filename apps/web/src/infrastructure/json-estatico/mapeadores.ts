// DTO del contrato L4 → modelo de dominio. Único lugar donde se conocen ambos.
import {
  cifra,
  eleccion,
  proporcion,
  type GrupoEdad,
  type ParticipacionEnEleccion,
  type Proporcion,
  type SerieParticipacion,
  type Sexo,
  type Territorio,
} from '@/domain';
import type { CifrasEleccionDto, CifrasPublicadasDto } from '@revoto/contracts';

const aProporciones = <K extends string>(r: Partial<Record<K, number>>) =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [k, proporcion(v as number)])) as Partial<
    Record<K, Proporcion>
  >;

const publicada = (e: CifrasEleccionDto): e is CifrasPublicadasDto => 'participacion' in e;

export function aSerie(
  territorio: Territorio,
  fuente: string,
  elecciones: CifrasEleccionDto[],
): SerieParticipacion {
  return {
    estado: 'publicada',
    territorio,
    fuente: { nombre: fuente },
    // Una elección sin `participacion` (RN-05 o sin denominador) no entra a la serie: la UI la
    // muestra como «sin dato» en lugar de inventar una cifra.
    elecciones: elecciones.filter(publicada).map((e): ParticipacionEnEleccion => {
      const el = eleccion(e.anio);
      return {
        eleccion: el,
        total: cifra(proporcion(e.participacion), territorio, el, { nombre: fuente }),
        listaNominal: e.lista_nominal,
        porEdad: aProporciones<GrupoEdad>(e.por_edad),
        porSexo: aProporciones<Sexo>(e.por_sexo),
      };
    }),
  };
}
