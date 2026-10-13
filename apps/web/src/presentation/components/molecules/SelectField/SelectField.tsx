import { useId } from 'react';
import { Icon } from '../../atoms';
import styles from './SelectField.module.css';

export interface SelectOption {
  value: string;
  text: string;
}

export interface SelectFieldProps {
  label: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/** Label with icon + 44 px native select (board C-02 «SelectField»). */
export function SelectField({
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder = 'Elige una opción',
}: SelectFieldProps) {
  const id = useId();
  return (
    <div className={[styles.selectField, disabled ? styles.disabled : ''].join(' ')}>
      <label htmlFor={id} className={styles.label}>
        <span className={styles.pin}>
          <Icon name="pin" size={14} />
        </span>
        {label}
      </label>
      <div className={styles.control}>
        <select
          id={id}
          className={styles.select}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.text}
            </option>
          ))}
        </select>
        <span className={styles.chevron}>
          <Icon name="chevd" size={18} />
        </span>
      </div>
    </div>
  );
}
