import { Icon, type IconName } from '../Icon';
import styles from './IconBubble.module.css';

export type BubbleTone =
  'brand-strong' | 'brand' | 'violet' | 'indigo' | 'neutral' | 'mint' | 'warning' | 'paper';
export type BubbleSize = 30 | 32 | 36 | 38 | 40 | 44;

export interface IconBubbleProps {
  icon: IconName;
  tone?: BubbleTone;
  size?: BubbleSize;
}

/** Circle with a tinted background and an icon (board C-01 «IconBubble»). Decorative. */
export function IconBubble({ icon, tone = 'brand', size = 36 }: IconBubbleProps) {
  return (
    <span
      className={[styles.iconBubble, styles[tone]].join(' ')}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon name={icon} size={Math.round(size / 2)} />
    </span>
  );
}
