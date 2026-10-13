import type { ReactNode } from 'react';
import estilos from './Texto.module.css';

export type RolTexto = 'h1' | 'h2' | 'entrada' | 'cuerpo' | 'meta' | 'etiqueta' | 'cifra';

export interface TextoProps {
  rol: RolTexto;
  children: ReactNode;
  /** Id para aria-labelledby. */
  id?: string;
}

/**
 * Escala tipográfica: títulos y cifras en Sora, texto en Plus Jakarta Sans. `h1` recibe el foco
 * al cambiar de pantalla (HU-14); `entrada` es el texto corto bajo el título.
 */
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
  if (rol === 'etiqueta' || rol === 'cifra') {
    return (
      <span id={id} className={estilos[rol]}>
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
