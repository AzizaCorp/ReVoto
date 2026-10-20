import { Icon, IconBubble, type BubbleTone, type IconName } from '../../atoms';
import styles from './SummaryRow.module.css';

export interface SummaryRowProps {
  icon: IconName;
  tone?: BubbleTone;
  value: string;
  context: string;
  pending?: boolean;
  onClick: () => void;
}

/** Navigable summary row: bubble + figure + context + chevron (board C-02 «SummaryRow»), W-10. */
export function SummaryRow({
  icon,
  tone = 'brand',
  value,
  context,
  pending,
  onClick,
}: SummaryRowProps) {
  return (
    <button type="button" className={styles.summaryRow} onClick={onClick}>
      <IconBubble icon={icon} tone={tone} size={36} />
      <span className={styles.texts}>
        <b className={[styles.value, pending ? styles.pending : ''].join(' ')}>{value}</b>
        <span className={styles.context}>{context}</span>
      </span>
      <span className={styles.chevron}>
        <Icon name="chev" size={18} />
      </span>
    </button>
  );
}
