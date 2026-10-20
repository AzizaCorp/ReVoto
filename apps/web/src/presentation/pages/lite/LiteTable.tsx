import type { ReactNode } from 'react';
import styles from './Lite.module.css';

export interface LiteTableProps {
  caption: string;
  head: readonly string[];
  /** The first cell of each row is its header (`<th scope="row">`). */
  rows: readonly (readonly ReactNode[])[];
  /** Columns from this index on are numbers (aligned to the right). */
  numericFrom?: number;
  /** Row header to highlight (the person's territory). */
  highlight?: ReactNode;
}

/** Plain data table of the lite version. */
export function LiteTable({ caption, head, rows, numericFrom = 1, highlight }: LiteTableProps) {
  const cls = (i: number) => (i >= numericFrom ? styles.number : undefined);
  return (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={h} scope="col" className={cls(i)}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([first, ...cells], r) => (
          <tr key={r} className={first === highlight ? styles.me : undefined}>
            <th scope="row">{first}</th>
            {cells.map((c, i) => (
              <td key={i} className={cls(i + 1)}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Label → value list (averages, archetype dimensions). */
export function LiteFacts({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <dl className={styles.facts}>
      {items.map(([k, v]) => (
        <div key={k} className={styles.fact}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
