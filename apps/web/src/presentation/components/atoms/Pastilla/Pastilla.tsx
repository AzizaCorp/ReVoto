import type { ReactNode } from 'react';
import estilos from './Pastilla.module.css';

export interface PastillaProps {
  children: ReactNode;
  /** Prefijo numérico, p. ej. «2/9». */
  numero?: string;
  /** `marca`: etiqueta de sección. `pendiente`: aviso «Datos pendientes» del esqueleto. */
  tono?: 'marca' | 'pendiente';
}

/** Píldora de sección («2/9 MÉXICO») o de estado («● DATOS PENDIENTES»). */
export function Pastilla({ children, numero, tono = 'marca' }: PastillaProps) {
  return (
    <span className={[estilos.pastilla, estilos[tono]].join(' ')}>
      {tono === 'pendiente' && <span aria-hidden="true">●</span>}
      {numero && <span>{numero}</span>}
      <b className={estilos.texto}>{children}</b>
    </span>
  );
}
