// US-24 · When the share buttons play their pop and shine. The light band of the border spins from
// the start (CSS); the bursts come after the screen has been read, more and more spaced out
// (Fibonacci), so a person who stays on a screen is reminded without being nagged.
import { useEffect, useState } from 'react';

/** First burst: 2 s after the screen appears. */
export const FIRST_BURST_MS = 2000;
/** Length of one burst; matches --rv-chroma-burst in tokens.css. */
export const BURST_MS = 1800;
/** Gaps stop growing here: one burst every 55 s at most. */
export const MAX_GAP_MS = 55_000;

/**
 * Milliseconds from one burst to the next, Fibonacci in seconds: 2, 3, 5, 8, 13, 21, 34, 55, 55…
 * The first value is the wait from the moment the screen appears.
 */
export function burstGaps(count: number): number[] {
  const gaps: number[] = [];
  let [a, b] = [1, 2];
  for (let i = 0; i < count; i++) {
    gaps.push(Math.min(b * 1000, MAX_GAP_MS));
    [a, b] = [b, a + b];
  }
  return gaps;
}

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true ||
    document.documentElement.dataset.motion === 'reduced' ||
    document.documentElement.dataset.reading === 'easy');

/** True while a burst plays. Off when disabled or under reduced motion and easy reading. */
export function useChromaBurst(active: boolean): boolean {
  const [bursting, setBursting] = useState(false);
  useEffect(() => {
    if (!active) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    let step = 0;
    let gaps = burstGaps(8);
    const wait = () => {
      const gap = gaps[step] ?? MAX_GAP_MS;
      step += 1;
      if (step >= gaps.length) gaps = burstGaps(step + 8);
      timer = setTimeout(play, gap);
    };
    const play = () => {
      if (reducedMotion()) return wait();
      setBursting(true);
      timer = setTimeout(() => {
        setBursting(false);
        wait();
      }, BURST_MS);
    };
    wait();
    return () => {
      clearTimeout(timer);
      setBursting(false);
    };
  }, [active]);
  return bursting;
}
