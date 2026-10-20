/**
 * Sequential classes for maps (W-02 to W-04): thresholds by quantiles, so every color step holds
 * about the same number of territories. `classes` colors need `classes − 1` thresholds.
 */
export function quantileBreaks(values: readonly number[], classes: number): number[] {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0 || classes < 2) return [];
  return Array.from({ length: classes - 1 }, (_, i) => {
    const q = ((i + 1) / classes) * (sorted.length - 1);
    const lo = Math.floor(q);
    const hi = Math.ceil(q);
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (q - lo);
  });
}

/** Class (0 … breaks.length) of a value: how many thresholds it reaches. */
export function classOf(value: number, breaks: readonly number[]): number {
  let c = 0;
  while (c < breaks.length && value >= breaks[c]!) c++;
  return c;
}
