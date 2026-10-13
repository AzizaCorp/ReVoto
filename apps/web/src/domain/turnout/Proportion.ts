declare const brand: unique symbol;

/** Value between 0 and 1. Formatting it as a percentage is the presentation's job. */
export type Proportion = number & { readonly [brand]: 'Proportion' };

export function proportion(value: number): Proportion {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`A proportion must be between 0 and 1: ${value}`);
  }
  return value as Proportion;
}

/** Difference in percentage points (a − b), e.g. territory vs. national. */
export function pointDifference(a: Proportion, b: Proportion): number {
  return Math.round((a - b) * 1000) / 10;
}
