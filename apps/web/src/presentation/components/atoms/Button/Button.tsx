import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  /** small 36 · medium 44 · large 52 (board C-01). */
  size?: ButtonSize;
  /** Icon before the text (decorative). */
  icon?: IconName;
  /** Icon after the text (decorative), e.g. the arrow of «Siguiente →». */
  trailingIcon?: IconName;
  /** Icon shown alone when the button collapses into a circle (‹ › on mobile). */
  compactIcon?: IconName;
  /** With `href` it renders as a link; otherwise as a button. */
  href?: string;
  /** With `href`: saves the file with this name instead of opening it (W-16 downloads). */
  download?: string;
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

/** Button or link with four variants and three sizes (board C-01 «Button»). */
export function Button({
  children,
  variant = 'secondary',
  size = 'medium',
  icon,
  trailingIcon,
  compactIcon,
  href,
  download,
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
        <span className={styles.icon}>
          <Icon name={icon} strokeWidth={2.2} />
        </span>
      )}
      <span className={styles.content}>{children}</span>
      {trailingIcon && (
        <span className={styles.icon}>
          <Icon name={trailingIcon} strokeWidth={2.4} />
        </span>
      )}
      {compactIcon && (
        <span className={styles.compact}>
          <Icon name={compactIcon} size={18} strokeWidth={2.4} />
        </span>
      )}
    </>
  );
  if (href) {
    return (
      <a className={className} href={href} download={download} aria-label={label} onClick={onClick}>
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
