import type { ReactNode } from 'react';
import styles from './NarrativeScreen.module.css';

export interface NarrativeScreenProps {
  /** Top zone (usually `TopBar`). */
  top: ReactNode;
  /** Bottom zone (usually `BottomBar`). */
  bottom: ReactNode;
  /** Message, figure and supporting text. */
  children: ReactNode;
  /** Visualization: below the text on mobile and tablet; on the right (7/12) on desktop. */
  visual?: ReactNode;
  /** Dark background with brand gradients (W-01). */
  dark?: boolean;
  /** On mobile the visual goes above the text (share cards W-09b, W-09c). */
  visualFirst?: boolean;
  /**
   * Supporting figures that go after the visual on mobile and under the text on tablet and
   * desktop (W-03 national figure, W-05 averages, canvas «Secuencia»).
   */
  after?: ReactNode;
  /** Tablet and desktop: the visual on the left and the text on the right (W-09). */
  visualLeft?: boolean;
}

/**
 * Narrative screen (manual §7.1, RIU-03). It takes the window height: the bars stay fixed at the
 * top and bottom and only the content scrolls when it does not fit, so nothing hides under the
 * buttons. Mobile: one column up to 480 px. Tablet: one column with 40 px margins. Desktop: 5/7
 * grid up to 1200 px.
 */
export function NarrativeScreen({
  top,
  bottom,
  children,
  visual,
  dark,
  visualFirst,
  after,
  visualLeft,
}: NarrativeScreenProps) {
  return (
    <div className={[styles.narrativeScreen, dark ? styles.dark : ''].join(' ')}>
      {top}
      <div className={styles.scroller}>
        <div
          className={[
            styles.content,
            visual ? styles.withVisual : '',
            visualFirst ? styles.visualFirst : '',
            after ? styles.withAfter : '',
            visualLeft ? styles.visualLeft : '',
          ].join(' ')}
        >
          <div className={styles.text}>{children}</div>
          {visual && <div className={styles.visual}>{visual}</div>}
          {after && <div className={styles.after}>{after}</div>}
        </div>
      </div>
      {bottom}
    </div>
  );
}
