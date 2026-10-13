import type { ReactNode } from 'react';
import estilos from './Ranura.module.css';

export type AltoRanura = 'linea' | 'chica' | 'media' | 'grande' | 'llena';

export interface RanuraProps {
  /** Qué va aquí cuando llegue el contenido real, p. ej. «Mapa de participación por municipio». */
  etiqueta: string;
  alto?: AltoRanura;
  /** Texto de muestra (p. ej. «—.— %»). Si falta, se muestra la etiqueta entre corchetes. */
  children?: ReactNode;
}

/**
 * Hueco del esqueleto: marca dónde irá una cifra, gráfica o ilustración mientras no hay datos.
 * Sigue la convención del diseño de alta fidelidad: «—.— %» y [corchetes]. Se retira pieza por
 * pieza en US-11 a US-14.
 */
export function Ranura({ etiqueta, alto = 'media', children }: RanuraProps) {
  return (
    <div className={[estilos.ranura, estilos[alto]].join(' ')} data-ranura={etiqueta}>
      {children ?? <span className={estilos.etiqueta}>[{etiqueta}]</span>}
    </div>
  );
}
