import type { ReactNode } from 'react';
import { Texto } from '../../atoms';
import estilos from './Aviso.module.css';

export type TonoAviso = 'info' | 'umbral' | 'error' | 'pendiente';

export interface AvisoProps {
  tono?: TonoAviso;
  titulo?: string;
  children: ReactNode;
}

/** Aviso de umbral RN-05, error (ALT-01), periodo faltante o datos pendientes (W-17). */
export function Aviso({ tono = 'info', titulo, children }: AvisoProps) {
  return (
    <div
      className={[estilos.aviso, estilos[tono]].join(' ')}
      role={tono === 'error' ? 'alert' : 'note'}
    >
      {titulo && <Texto rol="etiqueta">{titulo}</Texto>}
      <div>{children}</div>
    </div>
  );
}
