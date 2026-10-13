import type { ReactNode } from 'react';
import { Boton } from '../../atoms';
import estilos from './PantallaLigera.module.css';

export interface PantallaLigeraProps {
  onVersionCompleta: () => void;
  children: ReactNode;
  /** Navegación de texto al pie («‹ Anterior · Siguiente ›»). */
  pie?: ReactNode;
}

/** Plantilla de la versión ligera (W-15, RF-18): solo texto y tablas, sin imágenes ni gráficas. */
export function PantallaLigera({ onVersionCompleta, children, pie }: PantallaLigeraProps) {
  return (
    <div className={estilos.pantallaLigera}>
      <header className={estilos.encabezado}>
        <strong>ReVoto · versión ligera</strong>
        <Boton variante="texto" onClick={onVersionCompleta}>
          Versión completa
        </Boton>
      </header>
      <div className={estilos.cuerpo}>{children}</div>
      {pie && <footer className={estilos.pie}>{pie}</footer>}
    </div>
  );
}
