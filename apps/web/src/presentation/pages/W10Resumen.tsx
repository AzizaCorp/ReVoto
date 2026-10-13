import { Boton, PantallaUtilitaria, Ranura, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import { BarraUtilitaria } from './compartido/BarraUtilitaria';
import { useNumeroPaso } from './compartido/MarcoHistoria';

const CIFRAS = [
  ['—.— %', 'Nacional · [año]'],
  ['—.— %', '[Municipio] · [año]'],
  ['#— de [n]', 'Tu lugar en [Entidad] · [año]'],
  ['—.— pts', '18–24 vs. 60 + · [año]'],
  ['—.— pts', 'Mujeres vs. hombres · [año]'],
] as const;

/** W-10 · Tu resumen (RF-04, US-21). Cierre de la historia con cinco cifras. */
export function W10Resumen() {
  const nav = useNavegacion();
  const numero = useNumeroPaso();
  return (
    <PantallaUtilitaria
      superior={<BarraUtilitaria />}
      etiqueta="Resumen"
      numero={numero}
      titulo="Lo esencial, en cinco cifras"
      accion={
        <>
          <Boton
            variante="primario"
            tamano="grande"
            icono="↗"
            ancho
            onClick={() => nav.abrirHoja('W-12')}
          >
            Compartir mi resumen
          </Boton>
          <Boton tamano="chico" icono="↓" onClick={() => nav.irA('W-16')}>
            Datos abiertos
          </Boton>
          <Boton tamano="chico" icono="↺" onClick={() => nav.irA('W-01')}>
            Volver a empezar
          </Boton>
          <Boton
            tamano="chico"
            icono="‹"
            onClick={nav.anterior ?? undefined}
            etiqueta="Pantalla anterior"
          >
            Anterior
          </Boton>
        </>
      }
    >
      <Boton tamano="chico" icono="⌖" onClick={() => nav.irA('W-09')}>
        Tu municipio: «[Arquetipo]»
      </Boton>
      <Boton tamano="chico" icono="☆" onClick={() => nav.irA('W-09b')}>
        Tú: «[Insignia]»
      </Boton>
      {CIFRAS.map(([cifra, contexto]) => (
        <Ranura key={contexto} etiqueta={contexto} alto="chica">
          <Texto rol="cifra">{cifra}</Texto>
          <Texto rol="meta">{contexto}</Texto>
        </Ranura>
      ))}
    </PantallaUtilitaria>
  );
}
