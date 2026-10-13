import { useId } from 'react';
import { Texto } from '../../atoms';
import estilos from './CampoSelector.module.css';

export interface OpcionSelector {
  valor: string;
  texto: string;
}

export interface CampoSelectorProps {
  etiqueta: string;
  opciones: readonly OpcionSelector[];
  valor: string;
  onCambio: (valor: string) => void;
  deshabilitado?: boolean;
  /** Texto de la primera opción vacía. */
  vacio?: string;
}

/** `<select>` nativo con etiqueta visible (W-02: entidad y municipio dependiente). */
export function CampoSelector({
  etiqueta,
  opciones,
  valor,
  onCambio,
  deshabilitado,
  vacio = 'Elige una opción',
}: CampoSelectorProps) {
  const id = useId();
  return (
    <div className={estilos.campoSelector}>
      <label htmlFor={id}>
        <Texto rol="etiqueta">{etiqueta}</Texto>
      </label>
      <select
        id={id}
        className={estilos.selector}
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => onCambio(e.target.value)}
      >
        <option value="">{vacio}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </div>
  );
}
