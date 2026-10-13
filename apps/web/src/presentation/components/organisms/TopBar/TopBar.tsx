import { Button, IconButton, Logo, Text } from '../../atoms';
import { ProgressBar } from '../../molecules';
import styles from './TopBar.module.css';

export interface BarProgress {
  position: number;
  total: number;
  text: string;
}

export interface TopBarProps {
  /** No progress on screens outside the story (W-16, W-17). */
  progress?: BarProgress | null;
  /** Name of the current step; read next to the progress on desktop. */
  stepName?: string;
  onSettings: () => void;
  /** On desktop «Fuente» and «Compartir» move up to this bar. */
  onSource?: () => void;
  onShare?: () => void;
  /** Dark background (cover). */
  dark?: boolean;
}

/**
 * Top bar of the high-fidelity design.
 * Mobile: progress full width and, below it, logo + «Aa».
 * Tablet: logo · progress · «N/10» · «Aa» in one row.
 * Desktop: logo · progress with «Paso N de 10 · nombre» · Fuente · Compartir · «Aa».
 */
export function TopBar({ progress, stepName, onSettings, onSource, onShare, dark }: TopBarProps) {
  return (
    <header className={[styles.topBar, dark ? styles.dark : ''].join(' ')}>
      <div className={styles.logo}>
        <Logo on={dark ? 'dark' : 'light'} />
      </div>
      <div className={styles.progress}>
        {progress && (
          <>
            <ProgressBar {...progress} />
            {stepName && (
              <span className={styles.step} aria-hidden="true">
                <Text variant="meta">
                  Paso {progress.position} de {progress.total} · {stepName}
                </Text>
              </span>
            )}
          </>
        )}
      </div>
      {progress && (
        <span className={styles.counter} aria-hidden="true">
          {progress.position}/{progress.total}
        </span>
      )}
      <div className={styles.actions}>
        {onSource && (
          <Button size="small" icon="ⓘ" onClick={onSource}>
            Fuente
          </Button>
        )}
        {onShare && (
          <Button size="small" icon="↗" onClick={onShare}>
            Compartir
          </Button>
        )}
      </div>
      <div className={styles.settings}>
        <IconButton label="Ajustes de lectura" onClick={onSettings}>
          Aa
        </IconButton>
      </div>
    </header>
  );
}
