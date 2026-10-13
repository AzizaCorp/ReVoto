import { Button, Text } from '../../atoms';
import styles from './BottomBar.module.css';

export interface BottomBarProps {
  /** Opens W-11. Every screen with a figure shows it (RF-12, RN-10). */
  onSource?: () => void;
  /** Opens W-12 if the screen can be shared (RF-15). */
  onShare?: () => void;
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
}

/**
 * Bottom bar of the high-fidelity design.
 * Mobile: Fuente · Compartir on the left and ‹ › as 44 px circles on the right.
 * Tablet: Fuente · Compartir and «← Anterior» / «Siguiente →» with text.
 * Desktop: source note on the left (Fuente and Compartir move up to the top bar).
 */
export function BottomBar({
  onSource,
  onShare,
  onPrevious,
  onNext,
  nextLabel = 'Siguiente',
  dark,
  hideNavigation,
}: BottomBarProps) {
  return (
    <nav
      className={[styles.bottomBar, dark ? styles.dark : ''].join(' ')}
      aria-label="Navegación de la historia"
    >
      <div className={styles.left}>
        {onSource && (
          <Button size="small" icon="ⓘ" collapsible="narrow" label="Fuente" onClick={onSource}>
            Fuente
          </Button>
        )}
        {onShare && (
          <Button size="small" icon="↗" collapsible="narrow" label="Compartir" onClick={onShare}>
            Compartir
          </Button>
        )}
      </div>
      <span className={styles.note}>
        <Text variant="meta">Fuente: conteos censales INE 2009–2024 · Sin datos personales</Text>
      </span>
      {!hideNavigation && (
        <div className={styles.right}>
          {onPrevious && (
            <Button collapsible icon="←" onClick={onPrevious} label="Pantalla anterior">
              Anterior
            </Button>
          )}
          {onNext ? (
            <Button
              collapsible
              variant={dark ? 'brand' : 'primary'}
              trailingIcon="→"
              onClick={onNext}
              label="Pantalla siguiente"
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
