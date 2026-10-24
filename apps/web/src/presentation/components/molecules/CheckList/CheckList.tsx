import { IconBubble, VisuallyHidden } from '../../atoms';
import styles from './CheckList.module.css';

export interface CheckItem {
  text: string;
  /** `null` while the pipeline has not run. */
  passed: boolean | null;
  /** What was measured, under the check (e.g. «2,518 archivos validados»). */
  detail?: string;
}

const STATUS = { true: 'Cumple', false: 'No cumple', null: 'Pendiente' } as const;

/** Validation checks with their status in words (W-20 «Reporte de calidad»). */
export function CheckList({ items }: { items: readonly CheckItem[] }) {
  return (
    <ul className={styles.checkList}>
      {items.map((c) => (
        <li key={c.text} className={styles.item}>
          <IconBubble
            icon={c.passed === false ? 'close' : 'check'}
            tone={c.passed === null ? 'neutral' : c.passed ? 'mint' : 'warning'}
            size={30}
          />
          <span className={styles.text}>
            {c.text}
            {c.detail && <span className={styles.detail}>{c.detail}</span>}
            <VisuallyHidden> · </VisuallyHidden>
          </span>
          <span className={styles.reference}>
            {STATUS[String(c.passed) as keyof typeof STATUS]}
          </span>
        </li>
      ))}
    </ul>
  );
}
