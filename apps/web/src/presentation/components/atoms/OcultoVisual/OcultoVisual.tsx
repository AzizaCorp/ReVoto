import type { ReactNode } from 'react';
import estilos from './OcultoVisual.module.css';

/** Texto solo para lector de pantalla (por ejemplo «Pantalla 4 de 10»). */
export function OcultoVisual({ children }: { children: ReactNode }) {
  return <span className={estilos.ocultoVisual}>{children}</span>;
}
