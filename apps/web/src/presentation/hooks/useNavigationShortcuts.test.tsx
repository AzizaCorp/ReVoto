import { fireEvent, render } from '@testing-library/react';
import { useNavigationShortcuts } from './useNavigationShortcuts';

function Story({ next, previous }: { next: () => void; previous: () => void }) {
  useNavigationShortcuts({ enabled: true, next, previous });
  return (
    <div>
      <p data-testid="text">Texto</p>
      <svg data-testid="map" data-gesture="map" />
    </div>
  );
}

const swipe = (el: Element, from: number, to: number, fingers = 1) => {
  const at = (x: number) =>
    Array.from({ length: fingers }, (_, i) => ({ clientX: x + i * 30, clientY: 100 }));
  fireEvent.touchStart(el, { touches: at(from), changedTouches: at(from) });
  fireEvent.touchEnd(el, { touches: [], changedTouches: at(to) });
};

describe('useNavigationShortcuts', () => {
  it('a horizontal swipe on the story changes the screen', () => {
    const next = vi.fn();
    const { getByTestId } = render(<Story next={next} previous={vi.fn()} />);
    swipe(getByTestId('text'), 300, 100);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('a swipe on a map or a pinch never changes the screen (DEF-31)', () => {
    const next = vi.fn();
    const previous = vi.fn();
    const { getByTestId } = render(<Story next={next} previous={previous} />);
    swipe(getByTestId('map'), 300, 100);
    swipe(getByTestId('text'), 100, 300, 2);
    expect(next).not.toHaveBeenCalled();
    expect(previous).not.toHaveBeenCalled();
  });
});
