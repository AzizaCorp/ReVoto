import { Ranura, Texto } from '@/presentation/components';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-03 · México votó (RF-06). Mapa nacional por municipio y participación nacional. */
export function W03MexicoVoto() {
  return (
    <MarcoHistoria
      pendiente
      etiqueta="México"
      visual={
        <>
          <Ranura etiqueta="Mapa de participación por municipio" alto="llena" />
          <Ranura etiqueta="Escala: menor → mayor participación" alto="linea" />
        </>
      }
    >
      <Texto rol="h1">Así vota México</Texto>
      <Texto rol="entrada">
        Cada municipio, coloreado según su participación en la elección federal [año].
      </Texto>
      <Ranura etiqueta="Selector: Presidencial / Intermedia" alto="linea" />
      <Ranura etiqueta="Participación nacional" alto="chica">
        <Texto rol="cifra">—.— %</Texto>
      </Ranura>
      <Texto rol="meta">Participación nacional · [año]</Texto>
    </MarcoHistoria>
  );
}
