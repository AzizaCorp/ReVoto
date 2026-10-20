import { Icon, VisuallyHidden } from '../../atoms';
import styles from './SearchField.module.css';

export interface SearchFieldProps {
  /** Accessible name of the field. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Search field with a magnifier (board C-02 «SearchField»), W-02. */
export function SearchField({ label, value, onChange, placeholder }: SearchFieldProps) {
  return (
    <label className={styles.searchField}>
      <VisuallyHidden>{label}</VisuallyHidden>
      <span className={styles.icon}>
        <Icon name="search" size={18} />
      </span>
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </label>
  );
}
