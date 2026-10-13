import type { ReactNode } from 'react';
import { IconBubble, Text, type BubbleTone, type IconName } from '../../atoms';
import styles from './StatCard.module.css';

export interface StatCardProps {
  label: string;
  /** Formatted figure, e.g. «63.4 %» or «—.— %» while there is no data. */
  value: string;
  pending?: boolean;
  /** Brand-soft background for the main figure of the group. */
  highlight?: boolean;
  icon?: IconName;
  tone?: BubbleTone;
  /** Large figure (hero) instead of the card size. */
  hero?: boolean;
  /** Extra line under the figure. */
  children?: ReactNode;
}

/** Label + figure card (board C-02 «StatCard»), W-03 to W-08. */
export function StatCard({
  label,
  value,
  pending,
  highlight,
  icon,
  tone = 'brand-strong',
  hero,
  children,
}: StatCardProps) {
  return (
    <div className={[styles.statCard, highlight ? styles.highlight : ''].join(' ')}>
      {icon && <IconBubble icon={icon} tone={tone} size={hero ? 44 : 36} />}
      <div className={styles.body}>
        <span className={styles.label}>{label}</span>
        <Text variant={hero ? 'figure' : 'figureSmall'} pending={pending}>
          {value}
        </Text>
        {children}
      </div>
    </div>
  );
}
