import type { ReactNode } from 'react';
import { Button } from '../../atoms';
import styles from './LiteScreen.module.css';

export interface LiteScreenProps {
  onFullVersion: () => void;
  children: ReactNode;
  /** Text navigation at the foot («‹ Anterior · Siguiente ›»). */
  footer?: ReactNode;
}

/** Lite version template (W-15, RF-18): only text and tables, no images or charts. */
export function LiteScreen({ onFullVersion, children, footer }: LiteScreenProps) {
  return (
    <div className={styles.liteScreen}>
      <header className={styles.header}>
        <strong>ReVoto · versión ligera</strong>
        <Button variant="text" onClick={onFullVersion}>
          Versión completa
        </Button>
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
}
