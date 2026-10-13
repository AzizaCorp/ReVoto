import { useEffect, useId, useRef, type ReactNode } from 'react';
import { BotonIcono, Texto } from '../../atoms';
import estilos from './HojaInferior.module.css';

export interface HojaInferiorProps {
  abierta: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

const ENFOCABLES =
  'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Hoja inferior (manual §7.2, RIU-06/07/10): ~70 % del alto en móvil, diálogo centrado desde
 * 768 px. Cierra con Escape, atrapa el foco y lo devuelve al control que la abrió.
 */
export function HojaInferior({ abierta, titulo, onCerrar, children }: HojaInferiorProps) {
  const idTitulo = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierta) return;
    const previo = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>(ENFOCABLES)?.focus();
    const teclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const lista = [...panel.current.querySelectorAll<HTMLElement>(ENFOCABLES)];
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (!primero || !ultimo) return;
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', teclado);
    return () => {
      document.removeEventListener('keydown', teclado);
      previo?.focus();
    };
  }, [abierta, onCerrar]);

  if (!abierta) return null;
  return (
    <div className={estilos.capa}>
      <button
        type="button"
        className={estilos.velo}
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={onCerrar}
      />
      <div
        ref={panel}
        className={estilos.hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
      >
        <span className={estilos.asa} aria-hidden="true" />
        <div className={estilos.encabezado}>
          <Texto rol="h2" id={idTitulo}>
            {titulo}
          </Texto>
          <BotonIcono etiqueta="Cerrar hoja" onClick={onCerrar}>
            ✕
          </BotonIcono>
        </div>
        <div className={estilos.contenido}>{children}</div>
      </div>
    </div>
  );
}
