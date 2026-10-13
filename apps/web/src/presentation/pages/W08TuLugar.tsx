import { Boton, Ranura, Texto } from '@/presentation/components';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-08 · Tu lugar en tu entidad. Posición del municipio entre los de su entidad. */
export function W08TuLugar() {
  return (
    <MarcoHistoria
      visual={
        <>
          <Ranura etiqueta="Ranking: mayor participación → tu municipio → menor" alto="llena" />
          <Boton variante="texto">Ver el Top 5 de [Entidad]</Boton>
        </>
      }
    >
      <Texto rol="etiqueta">Tu lugar</Texto>
      <Texto rol="h1">Tu lugar en [Entidad]</Texto>
      <Texto rol="meta">Entre los [n] municipios de [Entidad] · Elección federal [año]</Texto>
      <Ranura etiqueta="Posición" alto="chica">
        #— de [n]
      </Ranura>
      <Texto rol="cuerpo">Vota más que el —— % de los municipios de [Entidad].</Texto>
    </MarcoHistoria>
  );
}
