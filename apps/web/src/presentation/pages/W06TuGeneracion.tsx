import { Ranura, Texto } from '@/presentation/components';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-06 · Tu generación (RF-09, RN-04). Participación por grupo de edad, a nivel municipal. */
export function W06TuGeneracion() {
  return (
    <MarcoHistoria
      visual={
        <>
          <Ranura etiqueta="Selector: [Territorio] / Nacional" alto="linea" />
          <Ranura etiqueta="Barras por grupo de edad: 18–24 … 60 +" alto="llena" />
        </>
      }
    >
      <Texto rol="etiqueta">Tu generación</Texto>
      <Texto rol="h1">[Mensaje sobre la participación por edad]</Texto>
      <Ranura etiqueta="Brecha 18–24 vs. 60 +" alto="chica">
        —.— pts
      </Ranura>
      <Texto rol="cuerpo">
        [Texto descriptivo de la brecha entre el grupo más joven y el mayor, sin juicios.]
      </Texto>
    </MarcoHistoria>
  );
}
