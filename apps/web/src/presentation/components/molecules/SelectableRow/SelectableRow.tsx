import { IconBubble, RadioMark, type BubbleTone, type IconName } from '../../atoms';
import styles from './SelectableRow.module.css';

export interface SelectableRowProps {
  children: string;
  checked: boolean;
  onSelect: () => void;
  icon?: IconName;
  /** Bubble tone when it is not selected; selected is always `brand-strong`. */
  tone?: BubbleTone;
}

/** Radio row with bubble and RadioMark (board C-02 «SelectableRow»). Goes in a radiogroup. */
export function SelectableRow({
  children,
  checked,
  onSelect,
  icon = 'pin',
  tone = 'neutral',
}: SelectableRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      className={[styles.selectableRow, checked ? styles.on : ''].join(' ')}
      onClick={onSelect}
    >
      <IconBubble icon={icon} tone={checked ? 'brand-strong' : tone} size={32} />
      <span className={styles.text}>{children}</span>
      <RadioMark checked={checked} />
    </button>
  );
}
