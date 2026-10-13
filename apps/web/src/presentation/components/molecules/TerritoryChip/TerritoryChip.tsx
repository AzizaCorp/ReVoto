import { Button } from '../../atoms';
import styles from './TerritoryChip.module.css';

export interface TerritoryChipProps {
  /** Visible label, e.g. «Zapopan, Jalisco». */
  territory: string;
  onClick: () => void;
}

/** Active territory with the «cambiar» action (board C-02 «TerritoryChip»), HU-28. */
export function TerritoryChip({ territory, onClick }: TerritoryChipProps) {
  return (
    <span className={styles.territoryChip}>
      <Button
        size="small"
        icon="pin"
        trailingIcon="chevd"
        onClick={onClick}
        label={`Cambiar territorio: ${territory}`}
      >
        {territory}
      </Button>
    </span>
  );
}
