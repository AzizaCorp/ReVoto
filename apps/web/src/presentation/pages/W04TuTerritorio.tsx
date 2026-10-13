import { Ranura, Texto } from '@/presentation/components';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-04 · Tu territorio (RF-07). Tu municipio frente a su entidad, el país y sus vecinos. */
export function W04TuTerritorio() {
  return (
    <MarcoHistoria
      visual={
        <>
          <Ranura etiqueta="Mapa del municipio y sus vecinos" alto="llena" />
          <Ranura etiqueta="Comparado con: municipio · entidad · nacional · vecinos" alto="media" />
        </>
      }
    >
      <Texto rol="etiqueta">Tu territorio</Texto>
      <Texto rol="h1">[Municipio], [Entidad]</Texto>
      <Texto rol="meta">Elección federal [año] · lista nominal [n]</Texto>
      <Ranura etiqueta="Participación en tu municipio" alto="chica">
        —.— %
      </Ranura>
      <Texto rol="meta">± —.— pts vs. nacional</Texto>
    </MarcoHistoria>
  );
}
