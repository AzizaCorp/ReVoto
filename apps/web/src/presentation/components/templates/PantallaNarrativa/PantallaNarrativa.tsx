import type { ReactNode } from 'react';
import estilos from './PantallaNarrativa.module.css';

export interface PantallaNarrativaProps {
  /** Zona superior (normalmente `BarraSuperior`). */
  superior: ReactNode;
  /** Zona inferior (normalmente `BarraInferior`). */
  inferior: ReactNode;
  /** Mensaje, cifra y texto de apoyo. */
  children: ReactNode;
  /** Visualización: debajo del texto en móvil y tablet; a la derecha (7/12) en escritorio. */
  visual?: ReactNode;
  /** Fondo oscuro con degradados de marca (W-01). */
  oscura?: boolean;
}

/**
 * Pantalla narrativa (manual §7.1, RIU-03). Ocupa el alto de la ventana: las barras quedan fijas
 * arriba y abajo y solo el contenido se desplaza si no cabe, así nada queda debajo de los botones.
 * Móvil: una columna de hasta 480 px. Tablet: una columna con márgenes de 40 px. Escritorio:
 * rejilla 5/7 de hasta 1200 px.
 */
export function PantallaNarrativa({
  superior,
  inferior,
  children,
  visual,
  oscura,
}: PantallaNarrativaProps) {
  return (
    <div className={[estilos.pantallaNarrativa, oscura ? estilos.oscura : ''].join(' ')}>
      {superior}
      <div className={estilos.desplazable}>
        <div className={[estilos.contenido, visual ? estilos.conVisual : ''].join(' ')}>
          <div className={estilos.texto}>{children}</div>
          {visual && <div className={estilos.visual}>{visual}</div>}
        </div>
      </div>
      {inferior}
    </div>
  );
}
