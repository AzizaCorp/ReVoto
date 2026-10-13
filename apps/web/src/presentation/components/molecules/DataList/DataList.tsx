import { IconBubble, type BubbleTone, type IconName } from '../../atoms';
import styles from './DataList.module.css';

export interface DataItem {
  term: string;
  value: string;
  icon?: IconName;
  tone?: BubbleTone;
}

/** Term → value list in a card; each term can carry a bubble (board C-02 «DataList»), W-11, W-18. */
export function DataList({ items }: { items: readonly DataItem[] }) {
  return (
    <dl className={styles.dataList}>
      {items.map((d) => (
        <div key={d.term} className={styles.row}>
          {d.icon && <IconBubble icon={d.icon} tone={d.tone ?? 'brand'} size={32} />}
          <div className={styles.texts}>
            <dt className={styles.term}>{d.term}</dt>
            <dd className={styles.value}>{d.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
