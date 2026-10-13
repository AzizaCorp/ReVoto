import type { ReactNode } from 'react';
import { HojaInferior } from '../../organisms';
import estilos from './PlantillaHoja.module.css';

export interface PlantillaHojaProps {
  abierta: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  /** Acciones al pie de la hoja (p. ej. «Copiar cita», «Descargar imagen»). */
  acciones?: ReactNode;
}

/** Plantilla de hoja (manual §7.2): W-11 Fuente, W-12 Compartir y W-13 Ajustes. */
export function PlantillaHoja({
  abierta,
  titulo,
  onCerrar,
  children,
  acciones,
}: PlantillaHojaProps) {
  return (
    <HojaInferior abierta={abierta} titulo={titulo} onCerrar={onCerrar}>
      {children}
      {acciones && <div className={estilos.acciones}>{acciones}</div>}
    </HojaInferior>
  );
}
