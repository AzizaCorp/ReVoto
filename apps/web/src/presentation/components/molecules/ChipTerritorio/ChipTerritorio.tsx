import { Boton } from '../../atoms';
import estilos from './ChipTerritorio.module.css';

export interface ChipTerritorioProps {
  /** «Municipio, Entidad» o «Nacional». */
  territorio: string;
  onClick: () => void;
}

/** Chip con el territorio elegido; abre W-02 y regresa a la misma pantalla (HU-28). */
export function ChipTerritorio({ territorio, onClick }: ChipTerritorioProps) {
  return (
    <span className={estilos.chipTerritorio}>
      <Boton
        tamano="chico"
        icono="⌖"
        iconoFinal="▾"
        onClick={onClick}
        etiqueta={`Cambiar territorio: ${territorio}`}
      >
        {territorio}
      </Boton>
    </span>
  );
}
