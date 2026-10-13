import { Boton, Ranura, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-09 · El arquetipo de tu municipio (RF-11). Tarjeta A1–A5 según la clasificación. */
export function W09Arquetipo() {
  const nav = useNavegacion();
  return (
    <MarcoHistoria
      pendiente
      etiqueta="Tu arquetipo"
      compartible={false}
      visual={<Ranura etiqueta="Tarjeta del arquetipo (A1–A5)" alto="llena" />}
    >
      <Texto rol="h1">Tu municipio tiene personalidad</Texto>
      <Texto rol="entrada">
        Agrupamos los municipios por cómo han votado de 2009 a 2024: su nivel, su tendencia, cuánto
        suben en presidenciales y qué tan predecibles son.
      </Texto>
      <Ranura etiqueta="¿Por qué?" alto="chica">
        [Rasgo dominante] · Qué tan típico: —.—
      </Ranura>
      <Boton variante="primario" icono="↗" onClick={() => nav.abrirHoja('W-12')}>
        Compartir mi arquetipo
      </Boton>
    </MarcoHistoria>
  );
}
