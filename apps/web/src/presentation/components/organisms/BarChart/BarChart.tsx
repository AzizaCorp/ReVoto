import { useId } from 'react';
import { VisuallyHidden } from '../../atoms';
import styles from './BarChart.module.css';

export interface ChartBar {
  label: string;
  /** Formatted value above the bar, e.g. «63.1» or «—.—». */
  value: string;
  /** Height share, 0 to 1. `null` while there is no data. */
  ratio: number | null;
  kind: 'presidential' | 'midterm';
}

export interface BarChartProps {
  title: string;
  bars: readonly ChartBar[];
}

/** Example height while there is no data: it only shows the shape of the series. */
const PLACEHOLDER = { presidential: 0.72, midterm: 0.52 } as const;

/**
 * Series by election (board C-03 «BarChart»): presidential solid and midterm striped, so the
 * difference never depends on color alone (RN-03). Bars grow with a 90 ms stagger.
 */
export function BarChart({ title, bars }: BarChartProps) {
  const id = useId();
  return (
    <figure className={styles.barChart} aria-labelledby={id}>
      <figcaption id={id} className={styles.title}>
        {title}
      </figcaption>
      <div className={styles.plot} aria-hidden="true">
        {bars.map((b, i) => {
          const pending = b.ratio === null;
          const h = (pending ? PLACEHOLDER[b.kind] : Math.max(0, Math.min(1, b.ratio ?? 0))) * 100;
          return (
            <div key={b.label} className={styles.column}>
              <b className={[styles.value, pending ? styles.muted : ''].join(' ')}>{b.value}</b>
              <i
                className={[styles.bar, styles[b.kind], pending ? styles.pending : ''].join(' ')}
                style={{ height: `${h}%`, animationDelay: `${300 + i * 90}ms` }}
              />
              <span className={styles.label}>{b.label}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.legend} aria-hidden="true">
        <span>
          <i className={[styles.swatch, styles.presidential].join(' ')} />
          Presidencial
        </span>
        <span>
          <i className={[styles.swatch, styles.midterm].join(' ')} />
          Intermedia
        </span>
      </div>
      <VisuallyHidden>
        <ul>
          {bars.map((b) => (
            <li key={b.label}>
              {b.label}, {b.kind === 'presidential' ? 'presidencial' : 'intermedia'}: {b.value}
            </li>
          ))}
        </ul>
      </VisuallyHidden>
    </figure>
  );
}
