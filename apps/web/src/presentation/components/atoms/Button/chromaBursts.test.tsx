import { act, render, screen } from '@testing-library/react';
import { Button } from './Button';
import { burstGaps, BURST_MS } from './chromaBursts';

describe('US-24 · chroma bursts', () => {
  it('waits 2 s and then spaces the bursts out in Fibonacci seconds, up to 55 s', () => {
    expect(burstGaps(10)).toEqual([
      2000, 3000, 5000, 8000, 13000, 21000, 34000, 55000, 55000, 55000,
    ]);
  });

  describe('on a share button', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const button = () => screen.getByRole('button', { name: 'Compartir' });
    const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

    it('the border is lit from the start; the pop and shine come at 2 s, then 3 s and 5 s later', () => {
      render(<Button chroma="fucsia">Compartir</Button>);
      expect(button()).toHaveAttribute('data-chroma', 'fucsia');
      expect(button()).not.toHaveAttribute('data-burst');
      advance(1999);
      expect(button()).not.toHaveAttribute('data-burst');
      advance(1);
      expect(button()).toHaveAttribute('data-burst');
      advance(BURST_MS);
      expect(button()).not.toHaveAttribute('data-burst');
      advance(2999);
      expect(button()).not.toHaveAttribute('data-burst');
      advance(1);
      expect(button()).toHaveAttribute('data-burst');
      advance(BURST_MS + 4999);
      expect(button()).not.toHaveAttribute('data-burst');
      advance(1);
      expect(button()).toHaveAttribute('data-burst');
    });

    it('does not burst under «Reducir movimiento»', () => {
      document.documentElement.dataset.motion = 'reduced';
      render(<Button chroma="oro">Compartir</Button>);
      advance(10_000);
      expect(button()).not.toHaveAttribute('data-burst');
      delete document.documentElement.dataset.motion;
    });
  });
});
