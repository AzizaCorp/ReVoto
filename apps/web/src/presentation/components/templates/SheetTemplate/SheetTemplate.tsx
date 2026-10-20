import type { ReactNode } from 'react';
import { BottomSheet } from '../../organisms';
import styles from './SheetTemplate.module.css';

export interface SheetTemplateProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Actions at the foot of the sheet (e.g. «Copiar cita», «Descargar imagen»). */
  actions?: ReactNode;
  presentation?: 'sheet' | 'popover';
}

/** Sheet template (manual §7.2): W-11 Fuente, W-12 Compartir and W-13 Ajustes. */
export function SheetTemplate({
  open,
  title,
  onClose,
  children,
  actions,
  presentation,
}: SheetTemplateProps) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose} presentation={presentation}>
      {children}
      {actions && <div className={styles.actions}>{actions}</div>}
    </BottomSheet>
  );
}
