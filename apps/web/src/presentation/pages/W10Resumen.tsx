import { Boton, PantallaUtilitaria, Ranura } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import { BarraUtilitaria } from './compartido/BarraUtilitaria';

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
  return (
    <PantallaUtilitaria
      superior={<BarraUtilitaria />}
      titulo="Lo esencial, en cinco cifras"
      onVolver={nav.anterior ?? undefined}
      accion={
        <>
          <Boton variante="primario" ancho onClick={() => nav.abrirHoja('W-12')}>
            Compartir mi resumen
          </Boton>
          <Boton onClick={() => nav.irA('W-16')}>Datos abiertos</Boton>
          <Boton variante="texto" onClick={() => nav.irA('W-01')}>
            Volver a empezar
          </Boton>
        </>
      }
    >
      <Boton onClick={() => nav.irA('W-09')}>Tu municipio: «[Arquetipo]»</Boton>
      <Boton onClick={() => nav.irA('W-09b')}>Tú: «[Insignia]»</Boton>
      {CIFRAS.map(([cifra, contexto]) => (
        <Ranura key={contexto} etiqueta={contexto} alto="chica">
          {cifra} · {contexto}
        </Ranura>
      ))}
    </PantallaUtilitaria>
  );
}
