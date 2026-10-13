import { useId } from 'react';
import { Text } from '../../atoms';
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
  /** Text of the first, empty option. */
  placeholder?: string;
}

/** Native `<select>` with a visible label (W-02: state and dependent municipality). */
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
    <div className={styles.selectField}>
      <label htmlFor={id}>
        <Text variant="label">{label}</Text>
      </label>
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
    </div>
  );
}
