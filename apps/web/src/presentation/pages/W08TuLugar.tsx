import { Boton, Ranura, Texto } from '@/presentation/components';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-08 · Tu lugar en tu entidad. Posición del municipio entre los de su entidad. */
export function W08TuLugar() {
  return (
    <MarcoHistoria
      pendiente
      etiqueta="Tu lugar"
      visual={
        <>
          <Ranura etiqueta="Ranking: mayor participación → tu municipio → menor" alto="llena" />
          <Boton variante="texto">Ver el Top 5 de [Entidad]</Boton>
        </>
      }
    >
      <Texto rol="h1">Tu lugar en [Entidad]</Texto>
      <Texto rol="meta">Entre los [n] municipios de [Entidad] · Elección federal [año]</Texto>
      <Ranura etiqueta="Posición" alto="chica">
        <Texto rol="cifra">#— de [n]</Texto>
      </Ranura>
      <Texto rol="entrada">Vota más que el —— % de los municipios de [Entidad].</Texto>
    </MarcoHistoria>
  );
}
