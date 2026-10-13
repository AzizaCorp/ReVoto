import type { ReactNode } from 'react';
import estilos from './PantallaNarrativa.module.css';

export interface PantallaNarrativaProps {
  /** Zona superior de 56 px (normalmente `BarraSuperior`). */
  superior: ReactNode;
  /** Zona inferior de 72 px (normalmente `BarraInferior`). */
  inferior: ReactNode;
  /** Mensaje, cifra y texto de apoyo. */
  children: ReactNode;
  /** Visualización. En móvil va debajo del texto; desde 768 px, a la derecha. */
  visual?: ReactNode;
}

/**
 * Plantilla de la pantalla narrativa (manual §7.1, RIU-03): 56 px · contenido sin scroll · 72 px.
 * Responsive: una columna en móvil (marco de hasta 480 px), dos columnas desde 768 px y rejilla
 * 5/7 con contenido de hasta 1200 px desde 1200 px.
 */
export function PantallaNarrativa({
  superior,
  inferior,
  children,
  visual,
}: PantallaNarrativaProps) {
  return (
    <div className={estilos.pantallaNarrativa}>
      <div className={estilos.superior}>{superior}</div>
      <div className={[estilos.contenido, visual ? estilos.conVisual : ''].join(' ')}>
        <div className={estilos.texto}>{children}</div>
        {visual && <div className={estilos.visual}>{visual}</div>}
      </div>
      <div className={estilos.inferior}>{inferior}</div>
    </div>
  );
}
