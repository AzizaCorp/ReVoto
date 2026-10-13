import estilos from './Interruptor.module.css';

export interface InterruptorProps {
  /** Id del texto que lo nombra (aria-labelledby). */
  etiquetadoPor: string;
  activo: boolean;
  onCambio: (activo: boolean) => void;
}

/** Interruptor accesible (`role="switch"`): lectura fácil, movimiento reducido, versión ligera. */
export function Interruptor({ etiquetadoPor, activo, onCambio }: InterruptorProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-labelledby={etiquetadoPor}
      className={[estilos.interruptor, activo ? estilos.activo : ''].join(' ')}
      onClick={() => onCambio(!activo)}
    >
      <span className={estilos.perilla} aria-hidden="true" />
    </button>
  );
}
