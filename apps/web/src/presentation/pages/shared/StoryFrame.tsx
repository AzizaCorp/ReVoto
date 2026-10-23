import type { ReactNode } from 'react';
import {
  BottomBar,
  Button,
  NarrativeScreen,
  Pill,
  TopBar,
  type BottomAction,
} from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import styles from './StoryFrame.module.css';

export interface StoryFrameProps {
  children: ReactNode;
  visual?: ReactNode;
  /** Section pill («MÉXICO»). The «N/9» number comes from the engine. */
  label?: string;
  /** Prefix of the cover pill («ELECCIONES FEDERALES» before «2009–2024»). */
  labelPrefix?: string;
  /** Shows the skeleton's «Datos pendientes» pill. */
  pending?: boolean;
  /**
   * The screen shows figures: it gets «Fuente» (RF-12). Fuente and Compartir only make sense
   * from W-03 on (after «Sobre ti»), so the cover turns both off.
   */
  hasSource?: boolean;
  /** The screen can be shared: it gets «Compartir» (RF-15). */
  shareable?: boolean;
  /** Cover: dark background, no step number and no ‹ › (it moves on with its main button). */
  cover?: boolean;
  /** Replaces «Fuente» and «Compartir» in the bottom bar (W-10: «Metodología»). */
  secondaryAction?: BottomAction;
  /** On mobile the visual goes above the text. */
  visualFirst?: boolean;
  /** Supporting block: after the visual on mobile, under the text from tablet up. */
  after?: ReactNode;
  /** Tablet and desktop: the visual on the left (W-09). */
  visualLeft?: boolean;
  /** Text of the forward button («Continuar» in W-02, «Ver mis cifras» in W-02b). */
  nextLabel?: string;
  /** Replaces the plain «next» of the sequence (W-02 confirms the territory first). */
  onNext?: () => void;
}

/** Number of the section pill: the cover does not count, so W-03 is «2/9». */
export function useStepNumber(): string | undefined {
  const { progress } = useNavigation();
  return progress && progress.position > 1
    ? `${progress.position - 1}/${progress.total - 1}`
    : undefined;
}

/** Joins the narrative template with the sequence engine: bars, progress and navigation. */
export function StoryFrame({
  children,
  visual,
  label,
  labelPrefix,
  pending,
  hasSource = true,
  shareable = true,
  cover,
  secondaryAction,
  visualFirst,
  after,
  visualLeft,
  nextLabel,
  onNext,
}: StoryFrameProps) {
  const nav = useNavigation();
  const number = useStepNumber();
  const openSource = hasSource ? () => nav.openSheet('W-11') : undefined;
  const openShare = shareable ? () => nav.openSheet('W-12') : undefined;
  return (
    <NarrativeScreen
      dark={cover}
      visual={visual}
      visualFirst={visualFirst}
      after={after}
      visualLeft={visualLeft}
      top={
        <TopBar
          dark={cover}
          progress={nav.progress}
          stepName={nav.stepName ?? undefined}
          onSettings={() => nav.openSheet('W-13')}
          onSource={openSource}
          onShare={openShare}
        />
      }
      bottom={
        <BottomBar
          dark={cover}
          onSource={openSource}
          onShare={openShare}
          secondaryAction={secondaryAction}
          onPrevious={nav.previous}
          onNext={onNext ?? nav.next}
          {...(nextLabel ? { nextLabel } : {})}
          hideNavigation={cover}
          note={cover}
        />
      }
    >
      {(label || pending) && (
        <div className={styles.pillRow}>
          {label && <Pill number={cover ? labelPrefix : number}>{label}</Pill>}
          {pending && <Pill tone="pending">Datos pendientes</Pill>}
        </div>
      )}
      {children}
      {openSource && !cover && (
        <p className={styles.source}>
          <Button variant="text" size="small" icon="info" onClick={openSource}>
            Fuente: INE, conteos censales 2009–2024
          </Button>
        </p>
      )}
    </NarrativeScreen>
  );
}
