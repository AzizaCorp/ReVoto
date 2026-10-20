import type { ReactNode } from 'react';
import styles from './Slot.module.css';

export type SlotHeight = 'line' | 'small' | 'medium' | 'large' | 'fill';

export interface SlotProps {
  /** What goes here once the real content arrives, e.g. «Mapa de participación por municipio». */
  label: string;
  height?: SlotHeight;
  /** Sample text (e.g. «—.— %»). Without it, the label is shown in brackets. */
  children?: ReactNode;
}

/**
 * Skeleton placeholder: marks where a figure, chart or illustration will go while there is no
 * data. It follows the high-fidelity design convention: «—.— %» and [brackets]. It is replaced
 * piece by piece in US-11 to US-14.
 */
export function Slot({ label, height = 'medium', children }: SlotProps) {
  return (
    <div className={[styles.slot, styles[height]].join(' ')} data-slot={label}>
      {children ?? <span className={styles.label}>[{label}]</span>}
    </div>
  );
}
