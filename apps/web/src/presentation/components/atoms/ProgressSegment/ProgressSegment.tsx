import styles from './ProgressSegment.module.css';

/** One segment of the progress bar. Decorative: the text comes from `ProgressBar`. */
export function ProgressSegment({ active }: { active: boolean }) {
  return (
    <span
      className={[styles.progressSegment, active ? styles.active : ''].join(' ')}
      data-active={active}
      aria-hidden="true"
    />
  );
}
