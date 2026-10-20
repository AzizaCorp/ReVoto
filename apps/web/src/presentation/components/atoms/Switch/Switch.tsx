import styles from './Switch.module.css';

export interface SwitchProps {
  /** Id of the text that names it (aria-labelledby). */
  labelledBy: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Accessible switch (`role="switch"`): easy reading, reduced motion, lite version. */
export function Switch({ labelledBy, checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      className={[styles.switch, checked ? styles.on : ''].join(' ')}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} aria-hidden="true" />
    </button>
  );
}
