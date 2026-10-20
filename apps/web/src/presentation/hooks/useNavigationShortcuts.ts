import { useEffect } from 'react';

interface Options {
  enabled: boolean;
  next: (() => void) | null;
  previous: (() => void) | null;
}

const FORM_FIELDS = ['INPUT', 'SELECT', 'TEXTAREA'];
/** Minimum distance (px) of a horizontal swipe to change screens. */
const SWIPE_THRESHOLD = 60;

/**
 * Arrow keys ← → and horizontal swipe (RF-02, US-09 CA-02). Does nothing inside form fields or
 * while a sheet is open (`enabled = false`).
 */
export function useNavigationShortcuts({ enabled, next, previous }: Options) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && FORM_FIELDS.includes(target.tagName)) return;
      if (e.key === 'ArrowRight' && next) next();
      if (e.key === 'ArrowLeft' && previous) previous();
    };
    let x0: number | null = null;
    let y0 = 0;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      x0 = t.clientX;
      y0 = t.clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (x0 === null || !t) return;
      const dx = t.clientX - x0;
      const dy = t.clientY - y0;
      x0 = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0 && next) next();
      if (dx > 0 && previous) previous();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, next, previous]);
}
