import { useState, type ReactNode } from 'react';
import { Button } from '../../atoms';
import styles from './ChartTable.module.css';

export interface ChartTableData {
  caption: string;
  head: readonly string[];
  /** The first cell of each row is its header (`<th scope="row">`). */
  rows: readonly (readonly ReactNode[])[];
  /** Columns from this index on are numbers, aligned to the right (default 1). */
  numericFrom?: number;
  /** Row header to highlight (the person's territory). */
  highlight?: ReactNode;
}

export interface ChartTableProps {
  /** The chart, shown by default. */
  children: ReactNode;
  /** The same figures as a table. */
  table: ChartTableData;
}

/**
 * A chart with its own «Ver como tabla» switch (DEF-24, HU-14): the figures swap to a table in the
 * same place, without leaving the story for the lite version. Each chart keeps its own choice.
 */
export function ChartTable({ children, table }: ChartTableProps) {
  const [asTable, setAsTable] = useState(false);
  const numeric = (i: number) => (i >= (table.numericFrom ?? 1) ? styles.number : undefined);
  return (
    <div className={styles.chartTable}>
      <div className={styles.toggle}>
        <Button
          variant="text"
          size="small"
          {...(asTable ? { icon: 'chart' as const } : {})}
          onClick={() => setAsTable((v) => !v)}
        >
          {asTable ? 'Ver como gráfica' : 'Ver como tabla'}
        </Button>
      </div>
      <div className={styles.view}>
        {asTable ? (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <caption className={styles.caption}>{table.caption}</caption>
              <thead>
                <tr>
                  {table.head.map((h, i) => (
                    <th key={i} scope="col" className={numeric(i)}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map(([first, ...cells], r) => (
                  <tr
                    key={r}
                    className={
                      table.highlight !== undefined && first === table.highlight
                        ? styles.me
                        : undefined
                    }
                  >
                    <th scope="row">{first}</th>
                    {cells.map((c, i) => (
                      <td key={i} className={numeric(i + 1)}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
