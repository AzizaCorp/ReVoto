import estilos from './ListaDatos.module.css';

export interface Dato {
  termino: string;
  valor: string;
}

/** Lista término → valor (ficha de fuente W-11, metadatos de descargas W-16). */
export function ListaDatos({ datos }: { datos: readonly Dato[] }) {
  return (
    <dl className={estilos.listaDatos}>
      {datos.map((d) => (
        <div key={d.termino} className={estilos.fila}>
          <dt className={estilos.termino}>{d.termino}</dt>
          <dd className={estilos.valor}>{d.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
