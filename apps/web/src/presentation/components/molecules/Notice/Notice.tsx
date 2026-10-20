import type { ReactNode } from 'react';
import { IconBubble, Text, type IconName } from '../../atoms';
import styles from './Notice.module.css';

export type NoticeTone = 'info' | 'threshold' | 'error' | 'pending';

export interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
}

const ICON: Record<NoticeTone, IconName> = {
  info: 'check',
  threshold: 'users',
  error: 'info',
  pending: 'info',
};

/** Notice with a bubble (board C-02 «Notice»): info, RN-05 threshold, error (ALT-01), pending. */
export function Notice({ tone = 'info', title, children }: NoticeProps) {
  return (
    <div
      className={[styles.notice, styles[tone]].join(' ')}
      role={tone === 'error' ? 'alert' : 'note'}
    >
      <IconBubble
        icon={ICON[tone]}
        tone={tone === 'info' ? 'paper' : tone === 'pending' ? 'brand' : 'warning'}
        size={30}
      />
      <div className={styles.body}>
        {title && <Text variant="label">{title}</Text>}
        <div>{children}</div>
      </div>
    </div>
  );
}
