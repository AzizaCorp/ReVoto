import { Button, IconButton, Logo, type ButtonChroma } from '../../atoms';
import { ProgressBar, type ProgressDirection } from '../../molecules';
import styles from './TopBar.module.css';

export interface BarProgress {
  position: number;
  total: number;
  text: string;
  direction?: ProgressDirection;
}

export interface TopBarProps {
  /** No progress on screens outside the story (W-15 to W-20): utility variant. */
  progress?: BarProgress | null;
  /** Name of the current step; read next to the progress on desktop. */
  stepName?: string;
  onSettings: () => void;
  /** On desktop «Fuente» and «Compartir» move up to this bar (only from W-03 on). */
  onSource?: () => void;
  onShare?: () => void;
  /** Attention color of «Compartir» (US-24). */
  shareChroma?: ButtonChroma;
  /** Utility variant: back button («Volver al resumen», «Datos abiertos»). */
  onBack?: () => void;
  backLabel?: string;
  /** Dark background (cover). */
  dark?: boolean;
}

/** Progress, logo and settings; one shape per breakpoint (board C-03 «TopBar»). */
export function TopBar({
  progress,
  stepName,
  onSettings,
  onSource,
  onShare,
  shareChroma = 'fucsia',
  onBack,
  backLabel = 'Volver',
  dark,
}: TopBarProps) {
  const utility = !progress && onBack;
  return (
    <header
      className={[styles.topBar, dark ? styles.dark : '', utility ? styles.utility : ''].join(' ')}
    >
      <div className={styles.logo}>
        <Logo on={dark ? 'dark' : 'light'} />
      </div>
      {progress && (
        <div className={styles.progress}>
          <ProgressBar {...progress} />
          {stepName && progress.position > 0 && (
            <span className={styles.step} aria-hidden="true">
              Pantalla {progress.position} de {progress.total} · {stepName}
            </span>
          )}
        </div>
      )}
      {progress && progress.position > 0 && (
        <span className={styles.counter} aria-hidden="true">
          {progress.position}/{progress.total}
        </span>
      )}
      <div className={styles.actions}>
        {onBack && (
          <span className={styles.back}>
            <Button size="small" icon="back" onClick={onBack}>
              {backLabel}
            </Button>
          </span>
        )}
        {onSource && (
          <span className={styles.wide}>
            <Button icon="info" onClick={onSource}>
              Fuente
            </Button>
          </span>
        )}
        {onShare && (
          <span className={styles.wide}>
            <Button icon="share" chroma={shareChroma} onClick={onShare}>
              Compartir
            </Button>
          </span>
        )}
        <IconButton label="Ajustes de lectura" onClick={onSettings}>
          Aa
        </IconButton>
      </div>
    </header>
  );
}
