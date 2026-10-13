import type { ReactNode } from 'react';
import { Button, Pill, Text } from '../../atoms';
import styles from './UtilityScreen.module.css';

export interface UtilityScreenProps {
  /** Top bar (W-02, W-02b and W-10 keep the progress). */
  top?: ReactNode;
  title: string;
  /** Section pill above the title, e.g. «TU TERRITORIO». */
  label?: string;
  /** Pill prefix, e.g. «1/9». */
  number?: string;
  /** Short text under the title. */
  lead?: string;
  onBack?: () => void;
  children: ReactNode;
  /** Actions fixed at the bottom (manual §7.3). */
  actions?: ReactNode;
  /** Second column on tablet and desktop (map, preview); below the content on mobile. */
  aside?: ReactNode;
}

/**
 * Utility screen (manual §7.3): title, scrolling content and actions fixed at the bottom.
 * The bars never cover the content: only the middle zone scrolls.
 */
export function UtilityScreen({
  top,
  title,
  label,
  number,
  lead,
  onBack,
  children,
  actions,
  aside,
}: UtilityScreenProps) {
  return (
    <div className={styles.utilityScreen}>
      {top ?? <div />}
      <div className={styles.scroller}>
        <div className={[styles.layout, aside ? styles.withAside : ''].join(' ')}>
          <div className={styles.body}>
            {onBack && (
              <div>
                <Button variant="text" size="small" icon="back" onClick={onBack}>
                  Volver
                </Button>
              </div>
            )}
            {label && <Pill number={number}>{label}</Pill>}
            <Text variant="h1">{title}</Text>
            {lead && <Text variant="lead">{lead}</Text>}
            {children}
          </div>
          {aside && <div className={styles.aside}>{aside}</div>}
        </div>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : <div />}
    </div>
  );
}
