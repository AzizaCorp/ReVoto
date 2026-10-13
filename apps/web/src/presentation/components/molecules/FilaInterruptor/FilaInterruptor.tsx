import { useId } from 'react';
import { Interruptor, Texto } from '../../atoms';
import estilos from './FilaInterruptor.module.css';

export interface FilaInterruptorProps {
  titulo: string;
  descripcion?: string;
  activo: boolean;
  onCambio: (activo: boolean) => void;
}

/** Ajuste con título, descripción e interruptor (W-01, W-13). */
export function FilaInterruptor({ titulo, descripcion, activo, onCambio }: FilaInterruptorProps) {
  const id = useId();
  return (
    <div className={estilos.filaInterruptor}>
      <div className={estilos.textos}>
        <Texto rol="cuerpo" id={id}>
          {titulo}
        </Texto>
        {descripcion && <Texto rol="meta">{descripcion}</Texto>}
      </div>
      <Interruptor etiquetadoPor={id} activo={activo} onCambio={onCambio} />
    </div>
  );
}
