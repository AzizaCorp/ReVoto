import type { ReactNode } from 'react';
import { Logo } from '../../atoms';
import styles from './ShareCard.module.css';

export interface ShareCardProps {
  /** Small caps line at the top, e.g. «[MUNICIPIO] ES…» or «ERES…». */
  kicker: string;
  title: string;
  subtitle?: string;
  /** Highlighted figure at the bottom, e.g. «+—.— pts». */
  figure?: string;
  figureCaption?: string;
  /** Source line printed on the card. */
  footer?: string;
  /** 9:16 (story) or 1:1 (post). */
  format?: 'story' | 'square';
  /** Decorative visual between the kicker and the title. */
  children?: ReactNode;
}

/**
 * Card for sharing (board C-03 «ShareCard»). The per-archetype and per-badge palettes (A1–A5,
 * I1–I6, 30 crossings) live in the design pages; until they are exported this uses the neutral ink
 * theme. The card is an image for others: its text is also readable here.
 */
export function ShareCard({
  kicker,
  title,
  subtitle,
  figure,
  figureCaption,
  footer,
  format = 'story',
  children,
}: ShareCardProps) {
  return (
    <article className={[styles.shareCard, styles[format]].join(' ')}>
      <div className={styles.top}>
        <span className={styles.kicker}>{kicker}</span>
        <Logo on="dark" />
      </div>
      {children && <div className={styles.visual}>{children}</div>}
      <div className={styles.texts}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {figure && (
        <p className={styles.figure}>
          <b>{figure}</b>
          {figureCaption && <span>{figureCaption}</span>}
        </p>
      )}
      {footer && <p className={styles.footer}>{footer}</p>}
    </article>
  );
}
