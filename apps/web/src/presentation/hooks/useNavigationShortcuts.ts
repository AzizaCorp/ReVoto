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
 * Elements with their own gestures: a swipe that starts on them never changes the screen (maps
 * that pan and pinch, sliders). DEF-31: pinching the map used to jump to the next screen.
 */
const OWN_GESTURES = '[data-gesture], input[type="range"]';

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
      const target = e.target instanceof Element ? e.target : null;
      // Two fingers are a pinch, not a swipe; gestures of a map or slider stay theirs.
      if (!t || e.touches.length > 1 || target?.closest(OWN_GESTURES)) {
        x0 = null;
        return;
      }
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
