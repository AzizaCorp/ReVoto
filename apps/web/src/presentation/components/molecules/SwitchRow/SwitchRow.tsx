import { useId } from 'react';
import { Switch, Text } from '../../atoms';
import styles from './SwitchRow.module.css';

export interface SwitchRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Setting with title, description and a switch (W-01, W-13). */
export function SwitchRow({ title, description, checked, onChange }: SwitchRowProps) {
  const id = useId();
  return (
    <div className={styles.switchRow}>
      <div className={styles.texts}>
        <Text variant="body" id={id}>
          {title}
        </Text>
        {description && <Text variant="meta">{description}</Text>}
      </div>
      <Switch labelledBy={id} checked={checked} onChange={onChange} />
    </div>
  );
}
