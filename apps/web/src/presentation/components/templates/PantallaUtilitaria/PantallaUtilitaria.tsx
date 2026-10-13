import type { ReactNode } from 'react';
import { Boton, Texto } from '../../atoms';
import estilos from './PantallaUtilitaria.module.css';

export interface PantallaUtilitariaProps {
  /** Barra superior opcional (W-02 y W-10 conservan el progreso). */
  superior?: ReactNode;
  titulo: string;
  /** Texto corto bajo el título. */
  entrada?: string;
  onVolver?: () => void;
  children: ReactNode;
  /** Acción principal fija abajo (manual §7.3). */
  accion?: ReactNode;
}

/** Plantilla utilitaria (manual §7.3): «‹ Volver» + título, scroll vertical y acción fija. */
export function PantallaUtilitaria({
  superior,
  titulo,
  entrada,
  onVolver,
  children,
  accion,
}: PantallaUtilitariaProps) {
  return (
    <div className={estilos.pantallaUtilitaria}>
      {superior}
      <div className={estilos.cuerpo}>
        {onVolver && (
          <div>
            <Boton variante="texto" onClick={onVolver}>
              ‹ Volver
            </Boton>
          </div>
        )}
        <Texto rol="h1">{titulo}</Texto>
        {entrada && <Texto rol="cuerpo">{entrada}</Texto>}
        {children}
      </div>
      {accion && <div className={estilos.accion}>{accion}</div>}
    </div>
  );
}
