import { useId } from 'react';
import { Chip } from '../../atoms';
import styles from './OptionGroup.module.css';

export interface OptionGroupProps {
  question: string;
  options: readonly string[];
  selected: string | null;
  onSelect: (option: string) => void;
}

/** Question + option chips (board C-02 «OptionGroup»), W-02b. Navigated with Tab and Space. */
export function OptionGroup({ question, options, selected, onSelect }: OptionGroupProps) {
  const id = useId();
  return (
    <fieldset className={styles.optionGroup} aria-labelledby={id}>
      <legend className={styles.legend} id={id}>
        {question}
      </legend>
      <div className={styles.options}>
        {options.map((o) => (
          <Chip key={o} pressed={selected === o} onClick={() => onSelect(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
