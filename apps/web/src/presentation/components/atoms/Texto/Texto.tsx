import type { ReactNode } from 'react';
import estilos from './Texto.module.css';

export type RolTexto = 'h1' | 'h2' | 'cuerpo' | 'meta' | 'etiqueta';

export interface TextoProps {
  rol: RolTexto;
  children: ReactNode;
  /** Id para aria-labelledby. */
  id?: string;
}

/** Escala tipográfica del manual §4. `h1` recibe el foco al cambiar de pantalla (HU-14). */
export function Texto({ rol, children, id }: TextoProps) {
  if (rol === 'h1') {
    return (
      <h1 id={id} className={estilos.h1} tabIndex={-1}>
        {children}
      </h1>
    );
  }
  if (rol === 'h2') {
    return (
      <h2 id={id} className={estilos.h2}>
        {children}
      </h2>
    );
  }
  if (rol === 'etiqueta') {
    return (
      <span id={id} className={estilos.etiqueta}>
        {children}
      </span>
    );
  }
  return (
    <p id={id} className={estilos[rol]}>
      {children}
    </p>
  );
}
