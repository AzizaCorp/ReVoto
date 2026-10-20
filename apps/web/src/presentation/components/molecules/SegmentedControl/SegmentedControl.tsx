import styles from './SegmentedControl.module.css';

export interface SegmentOption {
  value: string;
  text: string;
}

export interface SegmentedControlProps {
  /** Accessible name of the group. */
  label: string;
  options: readonly SegmentOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Mutually exclusive options in a gray track (board C-02 «SegmentedControl»), W-03, W-12, W-13. */
export function SegmentedControl({ label, options, value, onChange }: SegmentedControlProps) {
  return (
    <div className={styles.segmentedControl} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={[styles.option, o.value === value ? styles.on : ''].join(' ')}
          onClick={() => onChange(o.value)}
        >
          {o.text}
        </button>
      ))}
    </div>
  );
}
