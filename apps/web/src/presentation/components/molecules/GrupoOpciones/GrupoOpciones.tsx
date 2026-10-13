import { useId } from 'react';
import { Texto } from '../../atoms';
import estilos from './GrupoOpciones.module.css';

export interface GrupoOpcionesProps {
  pregunta: string;
  opciones: readonly string[];
  seleccion: string | null;
  onElegir: (opcion: string) => void;
}

/** Pregunta de opción única con botones grandes (W-02b). Se navega con Tab y Espacio. */
export function GrupoOpciones({ pregunta, opciones, seleccion, onElegir }: GrupoOpcionesProps) {
  const id = useId();
  return (
    <fieldset className={estilos.grupoOpciones} aria-labelledby={id}>
      <legend className={estilos.leyenda}>
        <Texto rol="cuerpo" id={id}>
          {pregunta}
        </Texto>
      </legend>
      <div className={estilos.opciones}>
        {opciones.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={seleccion === o}
            className={[estilos.opcion, seleccion === o ? estilos.elegida : ''].join(' ')}
            onClick={() => onElegir(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
