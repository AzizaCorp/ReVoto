import type { ReactNode } from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps {
  /** Required accessible name: the icon alone is not announced. */
  label: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Dark fill for the main action. */
  filled?: boolean;
}

/** Round 44 px button for «Aa», ‹ › and close (manual §6). */
export function IconButton({ label, children, onClick, disabled, filled }: IconButtonProps) {
  return (
    <button
      type="button"
      className={[styles.iconButton, filled ? styles.filled : ''].join(' ')}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
