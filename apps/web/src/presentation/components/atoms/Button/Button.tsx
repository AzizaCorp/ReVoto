import type { ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the text (decorative). */
  icon?: ReactNode;
  /** Icon after the text (decorative), e.g. the arrow of «Siguiente →». */
  trailingIcon?: ReactNode;
  /** With `href` it renders as a link; otherwise as a button. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Takes the full available width; with `'mobile'`, only below 768 px. */
  fullWidth?: boolean | 'mobile';
  /** Accessible name when the visible text is not enough or gets hidden. */
  label?: string;
  /**
   * Renders as a 44 px circle with only the icon: `mobile` below 768 px (‹ › on mobile),
   * `narrow` below 360 px (320 px screens). `true` means `mobile`.
   */
  collapsible?: boolean | 'mobile' | 'narrow';
}

/**
 * Brand button. `primary` (ink) is the main action, one per screen; `brand` (magenta) only on the
 * cover; `secondary` is the white pill; `text` is a link.
 */
export function Button({
  children,
  variant = 'secondary',
  size = 'medium',
  icon,
  trailingIcon,
  href,
  onClick,
  disabled,
  fullWidth,
  label,
  collapsible,
}: ButtonProps) {
  const className = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth === 'mobile' ? styles.fullWidthMobile : fullWidth ? styles.fullWidth : '',
    collapsible === 'narrow' ? styles.narrow : collapsible ? styles.collapsible : '',
  ].join(' ');
  const content = (
    <>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.content}>{children}</span>
      {trailingIcon && (
        <span className={styles.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </>
  );
  if (href) {
    return (
      <a className={className} href={href} aria-label={label} onClick={onClick}>
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {content}
    </button>
  );
}
