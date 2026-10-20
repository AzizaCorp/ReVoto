import { useId } from 'react';
import { IconBubble, Switch, type IconName } from '../../atoms';
import styles from './SwitchRow.module.css';

export interface SwitchRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: IconName;
}

/** Setting row: bubble, title, description and a switch (board C-02 «SwitchRow»), W-13. */
export function SwitchRow({ title, description, checked, onChange, icon }: SwitchRowProps) {
  const id = useId();
  return (
    <div className={styles.switchRow}>
      {icon && <IconBubble icon={icon} tone="brand" size={38} />}
      <div className={styles.texts}>
        <span className={styles.title} id={id}>
          {title}
        </span>
        {description && <span className={styles.description}>{description}</span>}
      </div>
      <Switch labelledBy={id} checked={checked} onChange={onChange} />
    </div>
  );
}
