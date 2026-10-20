import styles from './ComparisonBar.module.css';

export interface ComparisonBarProps {
  label: string;
  /** Formatted value, e.g. «2 de 3» or «—.— de 3». */
  value: string;
  /** Share of the track, 0 to 1. `null` while there is no data: dashed track. */
  ratio: number | null;
}

/** Label + track + value (board C-02 «ComparisonBar»), W-06, W-07, W-09b. */
export function ComparisonBar({ label, value, ratio }: ComparisonBarProps) {
  const pending = ratio === null;
  return (
    <div className={styles.comparisonBar}>
      <span className={styles.label}>{label}</span>
      <span className={[styles.track, pending ? styles.pending : ''].join(' ')} aria-hidden="true">
        {!pending && (
          <i
            className={styles.fill}
            style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
          />
        )}
      </span>
      <b className={[styles.value, pending ? styles.muted : ''].join(' ')}>{value}</b>
    </div>
  );
}
