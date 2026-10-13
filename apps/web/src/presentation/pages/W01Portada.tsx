import { Boton, Ranura, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-01 · Portada (RIU-01). Promesa, sin datos personales y entrada a la historia. */
export function W01Portada() {
  const nav = useNavegacion();
  return (
    <MarcoHistoria sinProgreso visual={<Ranura etiqueta="Collage de portada" alto="grande" />}>
      <Texto rol="etiqueta">Elecciones federales · 2009–2024</Texto>
      <Texto rol="h1">¿Cuánto vota tu territorio?</Texto>
      <Texto rol="cuerpo">
        Descubre en 10 pantallas cómo vota tu municipio frente al país. Sin datos personales.
      </Texto>
      <Boton variante="primario" ancho onClick={nav.siguiente ?? undefined}>
        Descubrir mi territorio
      </Boton>
    </MarcoHistoria>
  );
}
