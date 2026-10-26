import { Button, type ButtonChroma, type IconName } from '../../atoms';
import styles from './BottomBar.module.css';

export interface BottomAction {
  label: string;
  icon: IconName;
  onClick: () => void;
}

export interface BottomBarProps {
  /** Opens W-11. Every screen with a figure shows it (RF-12, RN-10). */
  onSource?: () => void;
  /** Opens W-12 if the screen can be shared (RF-15). */
  onShare?: () => void;
  /** Attention color of «Compartir» (US-24). */
  shareChroma?: ButtonChroma;
  /** Replaces «Fuente» and «Compartir» (W-10: «Metodología»). */
  secondaryAction?: BottomAction;
  /** `null` on the first step: the button is not drawn (HU-10, no wrap-around). */
  onPrevious: (() => void) | null;
  /** `null` on the last step: «Fin» is shown. */
  onNext: (() => void) | null;
  /** Label of the forward button. */
  nextLabel?: string;
  /** Dark background (cover). */
  dark?: boolean;
  /** No ‹ › and no «Fin»: the screen already has its own action to move on (cover). */
  hideNavigation?: boolean;
  /** Shows the source note even without «Fuente» (cover, from tablet up). */
  note?: boolean;
}

/** Story navigation; one shape per breakpoint (board C-03 «BottomBar»). */
export function BottomBar({
  onSource,
  onShare,
  shareChroma = 'fucsia',
  secondaryAction,
  onPrevious,
  onNext,
  nextLabel = 'Siguiente',
  dark,
  hideNavigation,
  note,
}: BottomBarProps) {
  const onlyNote = note && hideNavigation && !onSource && !onShare && !secondaryAction;
  return (
    <nav
      className={[styles.bottomBar, dark ? styles.dark : '', onlyNote ? styles.onlyNote : ''].join(
        ' ',
      )}
      aria-label="Navegación de la historia"
    >
      <div className={[styles.left, secondaryAction ? styles.keep : ''].join(' ')}>
        {secondaryAction ? (
          <Button icon={secondaryAction.icon} onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        ) : (
          <>
            {onSource && (
              <Button icon="info" collapsible="narrow" label="Fuente" onClick={onSource}>
                Fuente
              </Button>
            )}
            {onShare && (
              <Button
                icon="share"
                collapsible="narrow"
                label="Compartir"
                chroma={shareChroma}
                onClick={onShare}
              >
                Compartir
              </Button>
            )}
          </>
        )}
      </div>
      {!secondaryAction && (onSource || onShare || note) && (
        <span className={styles.note}>
          Fuente: conteos censales INE 2009–2024 · Sin datos personales
        </span>
      )}
      {!hideNavigation && (
        <div className={styles.right}>
          {onPrevious && (
            <Button
              collapsible
              icon="back"
              compactIcon="chevl"
              onClick={onPrevious}
              label="Pantalla anterior"
            >
              Anterior
            </Button>
          )}
          {onNext ? (
            <Button
              // A custom label («Continuar», «Saltar») says what happens: it never collapses.
              collapsible={nextLabel === 'Siguiente'}
              variant={dark ? 'brand' : 'primary'}
              trailingIcon="arrow"
              compactIcon="chev"
              onClick={onNext}
              label={nextLabel === 'Siguiente' ? 'Pantalla siguiente' : nextLabel}
            >
              {nextLabel}
            </Button>
          ) : (
            <span className={styles.end}>Fin</span>
          )}
        </div>
      )}
    </nav>
  );
}
