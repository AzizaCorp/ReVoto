// TypeScript mirror of the tokens the code needs (charts, layout calculations).
// Keep it in sync with tokens.css: if you change a value there, change it here.
import type { ElectionType } from '@/domain';

export const spacing = { 1: 8, 2: 16, 3: 24, 4: 32, 6: 48 } as const;

export const frame = {
  width: 360,
  height: 760,
  max: 480,
} as const;

export const touchTarget = 44;

/** Button heights (px): small 36 · medium 44 · large 52 (board C-01). */
export const buttonHeight = { small: 36, medium: 44, large: 52 } as const;

/** Motion durations (ms), board C-00. */
export const duration = {
  press: 160,
  state: 200,
  enter: 480,
  pop: 560,
  grow: 640,
  stagger: 70,
} as const;

/** Responsive breakpoints (px). In CSS they are written as literals inside @media (see tokens.css). */
export const breakpoints = { tablet: 768, desktop: 1200 } as const;

/** CSS variable with the fill of each kind of series; it never depends on color alone (RN-03). */
export const seriesFill: Record<ElectionType, string> = {
  presidential: 'var(--rv-series-presidential)',
  midterm: 'var(--rv-series-midterm)',
};
