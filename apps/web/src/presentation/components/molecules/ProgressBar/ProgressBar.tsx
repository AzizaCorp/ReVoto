import { ProgressSegment, VisuallyHidden } from '../../atoms';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  position: number;
  total: number;
  /** Full text for screen readers, e.g. «Pantalla 3 de 12». */
  text: string;
}

/** One segment per screen after the cover; the newest one fills in (board C-02 «ProgressBar»). */
export function ProgressBar({ position, total, text }: ProgressBarProps) {
  return (
    <div className={styles.progressBar}>
      {Array.from({ length: total }, (_, i) => (
        <ProgressSegment key={i} active={i < position} current={i === position - 1} />
      ))}
      <VisuallyHidden>{text}</VisuallyHidden>
    </div>
  );
}
