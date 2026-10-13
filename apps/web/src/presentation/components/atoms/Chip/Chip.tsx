import type { ReactNode } from 'react';
import styles from './Chip.module.css';

export interface ChipProps {
  children: ReactNode;
  pressed: boolean;
  onClick: () => void;
  /** `option`: answers (W-02b). `filter`: choosing an archetype or badge (W-09, W-09b, W-09c). */
  kind?: 'option' | 'filter';
  role?: 'radio';
}

/** Selectable chip (board C-01 «Chip»). */
export function Chip({ children, pressed, onClick, kind = 'option', role }: ChipProps) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : pressed}
      aria-checked={role ? pressed : undefined}
      className={[styles.chip, styles[kind], pressed ? styles.on : ''].join(' ')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
