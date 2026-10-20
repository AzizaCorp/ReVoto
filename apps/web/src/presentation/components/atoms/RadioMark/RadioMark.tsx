import { Icon } from '../Icon';
import styles from './RadioMark.module.css';

/** Visual selection circle (board C-01 «RadioMark»). The state is announced by its row. */
export function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span className={[styles.radioMark, checked ? styles.on : ''].join(' ')} aria-hidden="true">
      {checked && <Icon name="check" size={12} strokeWidth={3} />}
    </span>
  );
}
