import { ProgressSegment, VisuallyHidden } from '../../atoms';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  position: number;
  total: number;
  /** Text from the domain (`progress().text`), e.g. «Pantalla 4 de 10». */
  text: string;
}

/** Bar of N segments (RF-03). It recomputes itself if the sequence gets shorter (SRS 10.3). */
export function ProgressBar({ position, total, text }: ProgressBarProps) {
  return (
    <div className={styles.progressBar}>
      {Array.from({ length: total }, (_, i) => (
        <ProgressSegment key={i} active={i < position} />
      ))}
      <VisuallyHidden>{text}</VisuallyHidden>
    </div>
  );
}
