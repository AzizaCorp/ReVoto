import { classOf, quantileBreaks } from '.';

describe('Map scale', () => {
  it('splits the values in classes of about the same size', () => {
    const values = Array.from({ length: 101 }, (_, i) => i / 100);
    const breaks = quantileBreaks(values, 5);
    expect(breaks.map((b) => Number(b.toFixed(2)))).toEqual([0.2, 0.4, 0.6, 0.8]);
    expect(classOf(0.05, breaks)).toBe(0);
    expect(classOf(0.4, breaks)).toBe(2);
    expect(classOf(1, breaks)).toBe(4);
  });

  it('has no thresholds without values', () => {
    expect(quantileBreaks([], 7)).toEqual([]);
  });
});
