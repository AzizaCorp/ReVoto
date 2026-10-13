import styles from './DataList.module.css';

export interface DataItem {
  term: string;
  value: string;
}

/** Term → value list (source sheet W-11, download metadata W-16). */
export function DataList({ items }: { items: readonly DataItem[] }) {
  return (
    <dl className={styles.dataList}>
      {items.map((d) => (
        <div key={d.term} className={styles.row}>
          <dt className={styles.term}>{d.term}</dt>
          <dd className={styles.value}>{d.value}</dd>
        </div>
      ))}
    </dl>
  );
}
