import type { ReactNode } from 'react';
import styles from './LiteScreen.module.css';

export interface LiteScreenProps {
  onFullVersion: () => void;
  /** «Fuente» in the header (tablet and desktop only, as in boards TL/DL). */
  onSource?: () => void;
  /** «Ajustes»: easy reading and text size also apply here (DEF-28). */
  onSettings?: () => void;
  children: ReactNode;
  /** Text navigation at the foot («‹ Anterior · Siguiente ›»). */
  footer?: ReactNode;
}

/**
 * Lite version template (W-15, RF-18): text and tables only, system fonts, no images, charts or
 * motion (boards WL/TL/DL on the «secuencia» page).
 */
export function LiteScreen({
  onFullVersion,
  onSource,
  onSettings,
  children,
  footer,
}: LiteScreenProps) {
  return (
    <div className={styles.liteScreen}>
      <header className={styles.header}>
        <strong className={styles.brand}>ReVoto · versión ligera</strong>
        <nav className={styles.nav} aria-label="Versión ligera">
          {onSource && (
            <button
              type="button"
              className={`${styles.link} ${styles.wideOnly}`}
              onClick={onSource}
            >
              Fuente
            </button>
          )}
          {onSettings && (
            <button type="button" className={styles.link} onClick={onSettings}>
              Ajustes
            </button>
          )}
          <button type="button" className={styles.link} onClick={onFullVersion}>
            Versión completa
          </button>
        </nav>
      </header>
      <main className={styles.main}>
        <div className={styles.body}>{children}</div>
      </main>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
}
