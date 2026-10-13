import { Boton, Ranura, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-09c · Mi municipio y yo. Cruce del arquetipo con la insignia (30 combinaciones). */
export function W09cMunicipioYYo() {
  const nav = useNavegacion();
  return (
    <MarcoHistoria
      pendiente
      etiqueta="Mi municipio y yo"
      compartible={false}
      visual={<Ranura etiqueta="Tarjeta «Mi municipio y yo» (titular del cruce)" alto="llena" />}
    >
      <Texto rol="h1">Tu municipio y tú, en una tarjeta</Texto>
      <Texto rol="entrada">
        Juntamos el arquetipo de [Municipio] con tu insignia: cada cruce tiene su titular.
      </Texto>
      <Boton tamano="chico" icono="⌖" onClick={() => nav.irA('W-09')}>
        Tu municipio: «[Arquetipo]»
      </Boton>
      <Boton tamano="chico" icono="☆" onClick={() => nav.irA('W-09b')}>
        Tú: «[Insignia]»
      </Boton>
      <Boton variante="primario" icono="↗" onClick={() => nav.abrirHoja('W-12')}>
        Compartir los dos
      </Boton>
    </MarcoHistoria>
  );
}
