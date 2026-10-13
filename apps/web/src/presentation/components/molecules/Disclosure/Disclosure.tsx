import { useId, type ReactNode } from 'react';
import { Icon, IconBubble, type BubbleTone, type IconName } from '../../atoms';
import styles from './Disclosure.module.css';

export interface DisclosureProps {
  title: string;
  icon: IconName;
  tone?: BubbleTone;
  open: boolean;
  /** Without it the section is always open and is not a button (desktop methodology). */
  onToggle?: () => void;
  /** Anchor id, for the table of contents. */
  id?: string;
  children: ReactNode;
}

/** Card with a heading that opens and closes its content (W-18 «Metodología»). */
export function Disclosure({
  title,
  icon,
  tone = 'brand',
  open,
  onToggle,
  id,
  children,
}: DisclosureProps) {
  const panelId = useId();
  const head = (
    <>
      <IconBubble icon={icon} tone={tone} size={36} />
      <span className={styles.title}>{title}</span>
    </>
  );
  return (
    <section id={id} className={[styles.disclosure, open && onToggle ? styles.open : ''].join(' ')}>
      <h2 className={styles.heading}>
        {onToggle ? (
          <button
            type="button"
            className={styles.trigger}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
          >
            {head}
            <span className={styles.chevron}>
              <Icon name="chevd" size={18} />
            </span>
          </button>
        ) : (
          <span className={styles.trigger}>{head}</span>
        )}
      </h2>
      <div id={panelId} className={styles.panel} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
