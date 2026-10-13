import { Ranura, Texto } from '@/presentation/components';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-06 · Tu generación (RF-09, RN-04). Participación por grupo de edad, a nivel municipal. */
export function W06TuGeneracion() {
  return (
    <MarcoHistoria
      pendiente
      etiqueta="Tu generación"
      visual={
        <>
          <Ranura etiqueta="Selector: [Territorio] / Nacional" alto="linea" />
          <Ranura etiqueta="Barras por grupo de edad: 18–24 … 60 +" alto="llena" />
        </>
      }
    >
      <Texto rol="h1">[Mensaje sobre la participación por edad]</Texto>
      <Ranura etiqueta="Brecha 18–24 vs. 60 +" alto="chica">
        <Texto rol="cifra">—.— pts</Texto>
      </Ranura>
      <Texto rol="entrada">
        [Texto descriptivo de la brecha entre el grupo más joven y el mayor, sin juicios.]
      </Texto>
    </MarcoHistoria>
  );
}
