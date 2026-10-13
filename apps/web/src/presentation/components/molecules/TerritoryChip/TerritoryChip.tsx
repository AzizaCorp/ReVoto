import { Button } from '../../atoms';
import styles from './TerritoryChip.module.css';

export interface TerritoryChipProps {
  /** «Municipio, Entidad» or «Nacional». */
  territory: string;
  onClick: () => void;
}

/** Chip with the chosen territory; opens W-02 and comes back to the same screen (HU-28). */
export function TerritoryChip({ territory, onClick }: TerritoryChipProps) {
  return (
    <span className={styles.territoryChip}>
      <Button
        size="small"
        icon="⌖"
        trailingIcon="▾"
        onClick={onClick}
        label={`Cambiar territorio: ${territory}`}
      >
        {territory}
      </Button>
    </span>
  );
}
