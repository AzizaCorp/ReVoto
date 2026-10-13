import type { ReactNode } from 'react';
import estilos from './Boton.module.css';

export type VarianteBoton = 'primario' | 'marca' | 'secundario' | 'texto';
export type TamanoBoton = 'chico' | 'normal' | 'grande';

export interface BotonProps {
  children: ReactNode;
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  /** Icono antes del texto (decorativo). */
  icono?: ReactNode;
  /** Icono después del texto (decorativo), p. ej. la flecha de «Siguiente →». */
  iconoFinal?: ReactNode;
  /** Si llega `href`, se dibuja como enlace; si no, como botón. */
  href?: string;
  onClick?: () => void;
  deshabilitado?: boolean;
  /** Ocupa todo el ancho disponible; con `'movil'`, solo bajo 768 px. */
  ancho?: boolean | 'movil';
  /** Nombre accesible cuando el texto visible no basta o se oculta. */
  etiqueta?: string;
  /**
   * Se dibuja como círculo de 44 px con solo el icono: `movil` bajo 768 px (‹ › en móvil),
   * `estrecho` bajo 360 px (pantallas de 320 px). `true` equivale a `movil`.
   */
  colapsable?: boolean | 'movil' | 'estrecho';
}

/**
 * Botón de la marca. `primario` (tinta) es la acción principal, una por pantalla; `marca`
 * (magenta) solo en la portada; `secundario` es la píldora blanca; `texto` es un enlace.
 */
export function Boton({
  children,
  variante = 'secundario',
  tamano = 'normal',
  icono,
  iconoFinal,
  href,
  onClick,
  deshabilitado,
  ancho,
  etiqueta,
  colapsable,
}: BotonProps) {
  const clase = [
    estilos.boton,
    estilos[variante],
    estilos[tamano],
    ancho === 'movil' ? estilos.anchoMovil : ancho ? estilos.ancho : '',
    colapsable === 'estrecho' ? estilos.estrecho : colapsable ? estilos.colapsable : '',
  ].join(' ');
  const contenido = (
    <>
      {icono && (
        <span className={estilos.icono} aria-hidden="true">
          {icono}
        </span>
      )}
      <span className={estilos.contenido}>{children}</span>
      {iconoFinal && (
        <span className={estilos.icono} aria-hidden="true">
          {iconoFinal}
        </span>
      )}
    </>
  );
  if (href) {
    return (
      <a className={clase} href={href} aria-label={etiqueta} onClick={onClick}>
        {contenido}
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
      {contenido}
    </button>
  );
}
