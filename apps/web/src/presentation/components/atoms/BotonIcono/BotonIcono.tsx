import type { ReactNode } from 'react';
import estilos from './BotonIcono.module.css';

export interface BotonIconoProps {
  /** Nombre accesible obligatorio: el icono solo no se anuncia. */
  etiqueta: string;
  children: ReactNode;
  onClick?: () => void;
  deshabilitado?: boolean;
  /** Relleno oscuro para la acción principal (› Siguiente). */
  relleno?: boolean;
}

/** Botón cuadrado de 44 px para «Aa», ‹ › y cerrar (manual §6). */
export function BotonIcono({
  etiqueta,
  children,
  onClick,
  deshabilitado,
  relleno,
}: BotonIconoProps) {
  return (
    <button
      type="button"
      className={[estilos.botonIcono, relleno ? estilos.relleno : ''].join(' ')}
      aria-label={etiqueta}
      title={etiqueta}
      onClick={onClick}
      disabled={deshabilitado}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
