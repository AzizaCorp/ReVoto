import { useId } from 'react';
import { Text } from '../../atoms';
import styles from './OptionGroup.module.css';

export interface OptionGroupProps {
  question: string;
  options: readonly string[];
  selected: string | null;
  onSelect: (option: string) => void;
}

/** Single-choice question with large buttons (W-02b). Navigated with Tab and Space. */
export function OptionGroup({ question, options, selected, onSelect }: OptionGroupProps) {
  const id = useId();
  return (
    <fieldset className={styles.optionGroup} aria-labelledby={id}>
      <legend className={styles.legend}>
        <Text variant="body" id={id}>
          {question}
        </Text>
      </legend>
      <div className={styles.options}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={selected === o}
            className={[styles.option, selected === o ? styles.selected : ''].join(' ')}
            onClick={() => onSelect(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
