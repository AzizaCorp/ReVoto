import estilos from './SegmentoProgreso.module.css';

/** Un segmento de la barra de progreso. Decorativo: el texto lo da `BarraProgreso`. */
export function SegmentoProgreso({ activo }: { activo: boolean }) {
  return (
    <span
      className={[estilos.segmentoProgreso, activo ? estilos.activo : ''].join(' ')}
      data-activo={activo}
      aria-hidden="true"
    />
  );
}
