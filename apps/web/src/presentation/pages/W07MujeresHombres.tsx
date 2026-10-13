import { Ranura, Texto } from '@/presentation/components';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-07 · Mujeres y hombres (RF-10, RN-06). */
export function W07MujeresHombres() {
  return (
    <MarcoHistoria
      pendiente
      etiqueta="Mujeres y hombres"
      visual={<Ranura etiqueta="Mujeres —.— % · Hombres —.— %" alto="llena" />}
    >
      <Texto rol="h1">[Mensaje sobre la participación por sexo]</Texto>
      <Texto rol="meta">[Territorio] · Elección federal [año]</Texto>
      <Ranura etiqueta="Diferencia entre mujeres y hombres" alto="chica">
        <Texto rol="cifra">—.— pts</Texto>
      </Ranura>
      <Texto rol="meta">Se excluyen registros con sexo fuera de catálogo (RN-06).</Texto>
    </MarcoHistoria>
  );
}
