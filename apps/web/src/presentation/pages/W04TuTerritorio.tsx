import { ChipTerritorio, Ranura, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-04 · Tu territorio (RF-07). Tu municipio frente a su entidad, el país y sus vecinos. */
export function W04TuTerritorio() {
  const nav = useNavegacion();
  return (
    <MarcoHistoria
      pendiente
      etiqueta="Tu territorio"
      visual={
        <>
          <Ranura etiqueta="Mapa del municipio y sus vecinos" alto="llena" />
          <Ranura etiqueta="Comparado con: municipio · entidad · nacional · vecinos" alto="media" />
        </>
      }
    >
      <Texto rol="h1">[Municipio], [Entidad]</Texto>
      <ChipTerritorio territorio={nav.territorio} onClick={nav.cambiarTerritorio} />
      <Texto rol="meta">Elección federal [año] · lista nominal [n]</Texto>
      <Ranura etiqueta="Participación en tu municipio" alto="chica">
        <Texto rol="cifra">—.— %</Texto>
      </Ranura>
      <Texto rol="meta">± —.— pts vs. nacional</Texto>
    </MarcoHistoria>
  );
}
