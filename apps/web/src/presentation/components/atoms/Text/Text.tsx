import type { ReactNode } from 'react';
import styles from './Text.module.css';

export type TextVariant =
  'h1' | 'h2' | 'lead' | 'body' | 'meta' | 'label' | 'figure' | 'figureSmall';

export interface TextProps {
  variant: TextVariant;
  children: ReactNode;
  /** Id for aria-labelledby. */
  id?: string;
  /** Figure without data yet («—.— %»): painted in muted gray. */
  pending?: boolean;
}

/** Typographic variants; the size changes only by breakpoint through tokens (board C-01). */
export function Text({ variant, children, id, pending }: TextProps) {
  const className = [styles[variant], pending ? styles.pending : ''].join(' ');
  if (variant === 'h1') {
    return (
      <h1 id={id} className={className} tabIndex={-1}>
        {children}
      </h1>
    );
  }
  if (variant === 'h2') {
    return (
      <h2 id={id} className={className}>
        {children}
      </h2>
    );
  }
  if (variant === 'label' || variant === 'figure' || variant === 'figureSmall') {
    return (
      <span id={id} className={className}>
        {children}
      </span>
    );
  }
  return (
    <p id={id} className={className}>
      {children}
    </p>
  );
}
