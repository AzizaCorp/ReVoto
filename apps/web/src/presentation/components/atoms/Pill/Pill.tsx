import type { ReactNode } from 'react';
import styles from './Pill.module.css';

export interface PillProps {
  children: ReactNode;
  /** Numeric prefix, e.g. «2/9». */
  number?: string;
  /** `brand`: section label. `pending`: the skeleton's «Datos pendientes» notice. */
  tone?: 'brand' | 'pending';
}

/** Section pill («2/9 MÉXICO») or status pill («● DATOS PENDIENTES»). */
export function Pill({ children, number, tone = 'brand' }: PillProps) {
  return (
    <span className={[styles.pill, styles[tone]].join(' ')}>
      {tone === 'pending' && <span aria-hidden="true">●</span>}
      {number && <span>{number}</span>}
      <b className={styles.text}>{children}</b>
    </span>
  );
}
