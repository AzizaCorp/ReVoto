import type { ReactNode } from 'react';
import { BottomBar, NarrativeScreen, Pill, TopBar } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import styles from './StoryFrame.module.css';

export interface StoryFrameProps {
  children: ReactNode;
  visual?: ReactNode;
  /** Section pill («MÉXICO»). The «N/9» number comes from the engine. */
  label?: string;
  /** Shows the skeleton's «Datos pendientes» pill. */
  pending?: boolean;
  /** The screen shows figures: it gets «Fuente» (RF-12). */
  hasSource?: boolean;
  /** The screen can be shared: it gets «Compartir» (RF-15). */
  shareable?: boolean;
  /** Cover: dark background, no step number and no ‹ › (it moves on with its main button). */
  cover?: boolean;
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
  pending,
  hasSource = true,
  shareable = true,
  cover,
}: StoryFrameProps) {
  const nav = useNavigation();
  const number = useStepNumber();
  const openSource = hasSource ? () => nav.openSheet('W-11') : undefined;
  const openShare = shareable ? () => nav.openSheet('W-12') : undefined;
  return (
    <NarrativeScreen
      dark={cover}
      visual={visual}
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
          onPrevious={nav.previous}
          onNext={nav.next}
          hideNavigation={cover}
        />
      }
    >
      {(label || pending) && (
        <div className={styles.pillRow}>
          {label && <Pill number={cover ? undefined : number}>{label}</Pill>}
          {pending && <Pill tone="pending">Datos pendientes</Pill>}
        </div>
      )}
      {children}
    </NarrativeScreen>
  );
}
