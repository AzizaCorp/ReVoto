import { useEffect } from 'react';

interface Opciones {
  activo: boolean;
  siguiente: (() => void) | null;
  anterior: (() => void) | null;
}

const CAMPOS = ['INPUT', 'SELECT', 'TEXTAREA'];
/** Distancia mínima (px) de un deslizamiento horizontal para cambiar de pantalla. */
const UMBRAL_DESLIZAR = 60;

/**
 * Flechas ← → y deslizamiento horizontal (RF-02, US-09 CA-02). No actúa dentro de campos de
 * formulario ni con una hoja abierta (`activo = false`).
 */
export function useAtajosNavegacion({ activo, siguiente, anterior }: Opciones) {
  useEffect(() => {
    if (!activo) return;
    const teclado = (e: KeyboardEvent) => {
      const destino = e.target as HTMLElement | null;
      if (destino && CAMPOS.includes(destino.tagName)) return;
      if (e.key === 'ArrowRight' && siguiente) siguiente();
      if (e.key === 'ArrowLeft' && anterior) anterior();
    };
    let x0: number | null = null;
    let y0 = 0;
    const inicio = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      x0 = t.clientX;
      y0 = t.clientY;
    };
    const fin = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (x0 === null || !t) return;
      const dx = t.clientX - x0;
      const dy = t.clientY - y0;
      x0 = null;
      if (Math.abs(dx) < UMBRAL_DESLIZAR || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0 && siguiente) siguiente();
      if (dx > 0 && anterior) anterior();
    };
    window.addEventListener('keydown', teclado);
    window.addEventListener('touchstart', inicio, { passive: true });
    window.addEventListener('touchend', fin);
    return () => {
      window.removeEventListener('keydown', teclado);
      window.removeEventListener('touchstart', inicio);
      window.removeEventListener('touchend', fin);
    };
  }, [activo, siguiente, anterior]);
}
