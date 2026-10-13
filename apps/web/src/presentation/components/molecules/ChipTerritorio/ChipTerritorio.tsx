import { Boton } from '../../atoms';
import estilos from './ChipTerritorio.module.css';

export interface ChipTerritorioProps {
  /** «Entidad · Municipio» o «Nacional». */
  territorio: string;
  onClick: () => void;
}

/** Chip que muestra el territorio elegido y abre W-02 desde cualquier pantalla (HU-28). */
export function ChipTerritorio({ territorio, onClick }: ChipTerritorioProps) {
  return (
    <span className={estilos.chipTerritorio}>
      <Boton
        variante="secundario"
        compacto
        onClick={onClick}
        etiqueta={`Cambiar territorio: ${territorio}`}
      >
        <span className={estilos.texto}>{territorio}</span>
        <span aria-hidden="true">▾</span>
      </Boton>
    </span>
  );
}
