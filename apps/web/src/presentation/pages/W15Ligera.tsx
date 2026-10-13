import { useState } from 'react';
import { anterior, nombrePantalla, progreso, siguiente, type IdPantalla } from '@/domain';
import { Boton, PantallaLigera, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';

const ANIOS = [
  [2009, 'Intermedia'],
  [2012, 'Presidencial'],
  [2015, 'Intermedia'],
  [2018, 'Presidencial'],
  [2021, 'Intermedia'],
  [2024, 'Presidencial'],
] as const;

/** W-15 · Versión ligera (RF-18): la misma historia en texto y tablas, ≤ 500 KB. */
export function W15Ligera() {
  const nav = useNavegacion();
  const [id, setId] = useState<IdPantalla>(nav.ultimaPantalla);
  const ant = anterior(nav.secuencia, id);
  const sig = siguiente(nav.secuencia, id);
  return (
    <PantallaLigera
      onVersionCompleta={() => nav.irA(id)}
      pie={
        <>
          <Boton variante="texto" deshabilitado={!ant} onClick={() => ant && setId(ant)}>
            ‹ Anterior
          </Boton>
          <Boton variante="texto" deshabilitado={!sig} onClick={() => sig && setId(sig)}>
            Siguiente ›
          </Boton>
        </>
      }
    >
      <Texto rol="meta">
        {progreso(nav.secuencia, id).texto} · {nav.territorio}
      </Texto>
      <Texto rol="h1">{nombrePantalla(id)}</Texto>
      <Texto rol="cuerpo">[Mensaje de la pantalla]</Texto>
      <table>
        <caption>Participación por elección federal (datos pendientes)</caption>
        <thead>
          <tr>
            <th scope="col">Año</th>
            <th scope="col">Tipo</th>
            <th scope="col">Territorio</th>
            <th scope="col">Nacional</th>
          </tr>
        </thead>
        <tbody>
          {ANIOS.map(([anio, tipo]) => (
            <tr key={anio}>
              <th scope="row">{anio}</th>
              <td>{tipo}</td>
              <td>—.— %</td>
              <td>—.— %</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Texto rol="meta">Fuente: INE, conteos censales 2009–2024.</Texto>
    </PantallaLigera>
  );
}
