import { OcultoVisual, SegmentoProgreso } from '../../atoms';
import estilos from './BarraProgreso.module.css';

export interface BarraProgresoProps {
  posicion: number;
  total: number;
  /** Texto del dominio (`progreso().texto`), p. ej. «Pantalla 4 de 10». */
  texto: string;
}

/** Barra de N segmentos (RF-03). Se recalcula sola si la secuencia se acorta (SRS 10.3). */
export function BarraProgreso({ posicion, total, texto }: BarraProgresoProps) {
  return (
    <div className={estilos.barraProgreso}>
      {Array.from({ length: total }, (_, i) => (
        <SegmentoProgreso key={i} activo={i < posicion} />
      ))}
      <OcultoVisual>{texto}</OcultoVisual>
    </div>
  );
}
