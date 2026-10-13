import type { ReactNode } from 'react';
import { Boton, Pastilla, Texto } from '../../atoms';
import estilos from './PantallaUtilitaria.module.css';

export interface PantallaUtilitariaProps {
  /** Barra superior (W-02, W-02b y W-10 conservan el progreso). */
  superior?: ReactNode;
  titulo: string;
  /** Píldora de sección sobre el título, p. ej. «TU TERRITORIO». */
  etiqueta?: string;
  /** Prefijo de la píldora, p. ej. «1/9». */
  numero?: string;
  /** Texto corto bajo el título. */
  entrada?: string;
  onVolver?: () => void;
  children: ReactNode;
  /** Acciones fijas abajo (manual §7.3). */
  accion?: ReactNode;
}

/**
 * Pantalla utilitaria (manual §7.3): título, contenido que se desplaza y acciones fijas abajo.
 * Las barras no tapan el contenido: solo la zona central tiene scroll.
 */
export function PantallaUtilitaria({
  superior,
  titulo,
  etiqueta,
  numero,
  entrada,
  onVolver,
  children,
  accion,
}: PantallaUtilitariaProps) {
  return (
    <div className={estilos.pantallaUtilitaria}>
      {superior ?? <div />}
      <div className={estilos.desplazable}>
        <div className={estilos.cuerpo}>
          {onVolver && (
            <div>
              <Boton variante="texto" tamano="chico" icono="←" onClick={onVolver}>
                Volver
              </Boton>
            </div>
          )}
          {etiqueta && <Pastilla numero={numero}>{etiqueta}</Pastilla>}
          <Texto rol="h1">{titulo}</Texto>
          {entrada && <Texto rol="entrada">{entrada}</Texto>}
          {children}
        </div>
      </div>
      {accion ? <div className={estilos.accion}>{accion}</div> : <div />}
    </div>
  );
}
