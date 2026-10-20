import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon, IconButton, Text } from '../../atoms';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** `popover`: on desktop it opens under «Aa» instead of as a side panel (W-13). */
  presentation?: 'sheet' | 'popover';
}

const FOCUSABLE =
  'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Sheet with one presentation per breakpoint (board C-03 «Sheet»): bottom sheet on mobile, sheet
 * with margins on tablet, side panel (or popover) on desktop. Closes with Escape, traps focus and
 * returns it to the control that opened it.
 */
export function BottomSheet({
  open,
  title,
  onClose,
  children,
  presentation = 'sheet',
}: BottomSheetProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const list = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className={[
        styles.layer,
        presentation === 'popover' ? styles.asPopover : styles.asSheet,
      ].join(' ')}
    >
      <button
        type="button"
        className={styles.scrim}
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panel}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <span className={styles.handle} aria-hidden="true" />
        <div className={styles.header}>
          <Text variant="h2" id={titleId}>
            {title}
          </Text>
          <IconButton label="Cerrar hoja" onClick={onClose}>
            <Icon name="close" size={18} strokeWidth={2.2} />
          </IconButton>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
