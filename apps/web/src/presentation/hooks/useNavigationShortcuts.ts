import { useEffect } from 'react';

interface Options {
  enabled: boolean;
  next: (() => void) | null;
  previous: (() => void) | null;
}

const FORM_FIELDS = ['INPUT', 'SELECT', 'TEXTAREA'];
/**
 * A swipe changes the screen only when it is clearly one (DEF-30): long enough, mostly horizontal,
 * quick, and not started on a screen edge, where the phone's own «back» gesture lives and both
 * would fire, going back two screens.
 */
const SWIPE = {
  /** Minimum horizontal distance, px. */
  distance: 80,
  /** The horizontal distance must be at least this many times the vertical one (≈ 27°). */
  ratio: 2,
  /** Longer touches are reading, scrolling or selecting text, not a swipe, ms. */
  maxDuration: 600,
  /** Band on the left and right edges left to the system's back gesture, px. */
  edge: 24,
};
/**
 * Elements with their own gestures: a swipe that starts on them never changes the screen (maps
 * that pan and pinch, sliders). DEF-31: pinching the map used to jump to the next screen.
 */
const OWN_GESTURES = '[data-gesture], input[type="range"]';

/** A table or row that scrolls sideways keeps its horizontal swipes (DEF-30). */
function insideHorizontalScroll(el: Element | null): boolean {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const overflow = getComputedStyle(n).overflowX;
    if ((overflow === 'auto' || overflow === 'scroll') && n.scrollWidth > n.clientWidth)
      return true;
  }
  return false;
}

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
    let t0 = 0;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      const target = e.target instanceof Element ? e.target : null;
      x0 = null;
      // Two fingers are a pinch, not a swipe; gestures of a map, slider or wide table stay theirs.
      if (!t || e.touches.length > 1 || target?.closest(OWN_GESTURES)) return;
      if (t.clientX < SWIPE.edge || t.clientX > window.innerWidth - SWIPE.edge) return;
      if (insideHorizontalScroll(target)) return;
      x0 = t.clientX;
      y0 = t.clientY;
      t0 = performance.now();
    };
    const onTouchCancel = () => {
      x0 = null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (x0 === null || !t) return;
      const dx = t.clientX - x0;
      const dy = t.clientY - y0;
      x0 = null;
      if (Math.abs(dx) < SWIPE.distance || Math.abs(dx) < SWIPE.ratio * Math.abs(dy)) return;
      if (performance.now() - t0 > SWIPE.maxDuration) return;
      if (window.getSelection()?.toString()) return;
      if (dx < 0 && next) next();
      if (dx > 0 && previous) previous();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchCancel);
    return () => {
      window.removeEventListener('touchcancel', onTouchCancel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, next, previous]);
}
