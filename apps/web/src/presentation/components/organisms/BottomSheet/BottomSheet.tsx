import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton, Text } from '../../atoms';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet (manual §7.2, RIU-06/07/10): ~70 % of the height on mobile, centered dialog from
 * 768 px. Closes with Escape, traps focus and returns it to the control that opened it.
 */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
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
    <div className={styles.layer}>
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
            ✕
          </IconButton>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
