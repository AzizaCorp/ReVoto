import { ProgressSegment, VisuallyHidden } from '../../atoms';
import styles from './ProgressBar.module.css';

export type ProgressDirection = 'forward' | 'back';

export interface ProgressBarProps {
  position: number;
  total: number;
  /** Text from the domain (`progress().text`), e.g. «Pantalla 3 de 12». */
  text: string;
  /** How the person arrived: going back plays the fill in reverse (DEF-29). */
  direction?: ProgressDirection;
}

/** One segment per screen after the cover; the newest one fills in (board C-02 «ProgressBar»). */
export function ProgressBar({ position, total, text, direction = 'forward' }: ProgressBarProps) {
  const back = direction === 'back';
  return (
    <div className={styles.progressBar} data-direction={direction}>
      {Array.from({ length: total }, (_, i) => (
        <ProgressSegment
          key={i}
          active={i < position}
          current={i === position - 1}
          still={back}
          leaving={back && i === position}
        />
      ))}
      <VisuallyHidden>{text}</VisuallyHidden>
    </div>
  );
}
