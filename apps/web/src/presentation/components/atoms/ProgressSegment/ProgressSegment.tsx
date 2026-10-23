import styles from './ProgressSegment.module.css';

export interface ProgressSegmentProps {
  active: boolean;
  /** Newest active segment: it fills from the left when moving forward. */
  current?: boolean;
  /** Going back: the current segment is already full and does not fill again (DEF-29). */
  still?: boolean;
  /** Going back: the segment just left empties towards the left (DEF-29). */
  leaving?: boolean;
}

/** One segment of the progress bar. Decorative: the text comes from `ProgressBar`. */
export function ProgressSegment({ active, current, still, leaving }: ProgressSegmentProps) {
  return (
    <span
      className={[
        styles.progressSegment,
        active ? styles.active : '',
        current && !still ? styles.current : '',
        leaving && !active ? styles.leaving : '',
      ].join(' ')}
      data-active={active}
      data-leaving={leaving && !active ? true : undefined}
      aria-hidden="true"
    />
  );
}
