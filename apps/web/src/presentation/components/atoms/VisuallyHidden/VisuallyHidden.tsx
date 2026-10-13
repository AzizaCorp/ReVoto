import type { ReactNode } from 'react';
import styles from './VisuallyHidden.module.css';

/** Text only for screen readers (e.g. «Pantalla 4 de 10»). */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.visuallyHidden}>{children}</span>;
}
