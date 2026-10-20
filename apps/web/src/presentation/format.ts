// Number formats shown to people (es-MX). The domain keeps proportions from 0 to 1.
import { territoryLabel, type Territory } from '@/domain';

const integer = new Intl.NumberFormat('es-MX');

/** 0.6931 → «69.3 %». */
export const percent = (p: number) => `${(p * 100).toFixed(1)} %`;

/** 8.4 → «+8.4 pts»; −1.2 → «−1.2 pts». */
export const points = (pts: number) =>
  `${pts > 0 ? '+' : pts < 0 ? '−' : '±'}${Math.abs(pts).toFixed(1)} pts`;

/** 8.4 or −8.4 → «8.4 pts» (when the sentence already says which way). */
export const pointsAbs = (pts: number) => `${Math.abs(pts).toFixed(1)} pts`;

/** 7918590 → «7,918,590». */
export const count = (n: number) => integer.format(n);

/** Placeholder while the figures load. */
export const PENDING = '—.—';

/** «Iztacalco, Ciudad de México», «Jalisco», «Nacional». */
export const place = (t: Territory) => territoryLabel(t);
