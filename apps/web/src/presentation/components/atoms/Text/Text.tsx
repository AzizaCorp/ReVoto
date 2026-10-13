import type { ReactNode } from 'react';
import styles from './Text.module.css';

export type TextVariant = 'h1' | 'h2' | 'lead' | 'body' | 'meta' | 'label' | 'figure';

export interface TextProps {
  variant: TextVariant;
  children: ReactNode;
  /** Id for aria-labelledby. */
  id?: string;
}

/**
 * Type scale: titles and figures in Sora, text in Plus Jakarta Sans. `h1` gets focus when the
 * screen changes (HU-14); `lead` is the short text under the title.
 */
export function Text({ variant, children, id }: TextProps) {
  if (variant === 'h1') {
    return (
      <h1 id={id} className={styles.h1} tabIndex={-1}>
        {children}
      </h1>
    );
  }
  if (variant === 'h2') {
    return (
      <h2 id={id} className={styles.h2}>
        {children}
      </h2>
    );
  }
  if (variant === 'label' || variant === 'figure') {
    return (
      <span id={id} className={styles[variant]}>
        {children}
      </span>
    );
  }
  return (
    <p id={id} className={styles[variant]}>
      {children}
    </p>
  );
}
