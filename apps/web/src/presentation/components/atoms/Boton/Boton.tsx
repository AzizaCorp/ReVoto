import type { ReactNode } from 'react';
import estilos from './Boton.module.css';

export type VarianteBoton = 'primario' | 'secundario' | 'texto';

export interface BotonProps {
  children: ReactNode;
  variante?: VarianteBoton;
  /** Si llega `href`, se dibuja como enlace; si no, como botón. */
  href?: string;
  onClick?: () => void;
  deshabilitado?: boolean;
  /** Ocupa todo el ancho disponible (acción principal en móvil). */
  ancho?: boolean;
  etiqueta?: string;
  /** Menos relleno lateral, para barras con varias acciones en 360 px. */
  compacto?: boolean;
}

/** Botón de acción. Alto 48 px y uno primario por pantalla (manual §6, RF-02). */
export function Boton({
  children,
  variante = 'secundario',
  href,
  onClick,
  deshabilitado,
  ancho,
  etiqueta,
  compacto,
}: BotonProps) {
  const clase = [
    estilos.boton,
    estilos[variante],
    ancho ? estilos.ancho : '',
    compacto ? estilos.compacto : '',
  ].join(' ');
  if (href) {
    return (
      <a className={clase} href={href} aria-label={etiqueta} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={clase}
      onClick={onClick}
      disabled={deshabilitado}
      aria-label={etiqueta}
    >
      {children}
    </button>
  );
}
