import type { ReactNode } from 'react';
import { Text } from '../../atoms';
import styles from './Notice.module.css';

export type NoticeTone = 'info' | 'threshold' | 'error' | 'pending';

export interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
}

/** RN-05 threshold notice, error (ALT-01), missing period or pending data (W-17). */
export function Notice({ tone = 'info', title, children }: NoticeProps) {
  return (
    <div
      className={[styles.notice, styles[tone]].join(' ')}
      role={tone === 'error' ? 'alert' : 'note'}
    >
      {title && <Text variant="label">{title}</Text>}
      <div>{children}</div>
    </div>
  );
}
