import { Boton, Ranura, Texto } from '@/presentation/components';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-05 · Quince años de elecciones (RF-08, RN-03). Serie 2009–2024. */
export function W05QuinceAnios() {
  return (
    <MarcoHistoria
      pendiente
      etiqueta="15 años"
      visual={
        <>
          <Ranura
            etiqueta="Serie 2009–2024: presidenciales sólidas, intermedias rayadas"
            alto="llena"
          />
          <Boton variante="texto">Ver como tabla</Boton>
        </>
      }
    >
      <Texto rol="h1">[Mensaje sobre presidenciales e intermedias]</Texto>
      <Texto rol="meta">[Territorio] · Elecciones federales 2009–2024</Texto>
      <Ranura etiqueta="Promedios" alto="chica">
        Presidenciales —.— % · Intermedias —.— %
      </Ranura>
      <Texto rol="meta">2018 → 2024: ± —.— pts</Texto>
    </MarcoHistoria>
  );
}
