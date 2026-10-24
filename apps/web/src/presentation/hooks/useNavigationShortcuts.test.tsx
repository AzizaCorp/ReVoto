import { fireEvent, render } from '@testing-library/react';
import { useNavigationShortcuts } from './useNavigationShortcuts';

function Story({ next, previous }: { next: () => void; previous: () => void }) {
  useNavigationShortcuts({ enabled: true, next, previous });
  return (
    <div>
      <p data-testid="text">Texto</p>
      <svg data-testid="map" data-gesture="map" />
      <div data-testid="table" style={{ overflowX: 'auto' }}>
        <table />
      </div>
    </div>
  );
}

const swipe = (el: Element, from: number, to: number, fingers = 1, dy = 0) => {
  const at = (x: number, y = 100) =>
    Array.from({ length: fingers }, (_, i) => ({ clientX: x + i * 30, clientY: y }));
  fireEvent.touchStart(el, { touches: at(from), changedTouches: at(from) });
  fireEvent.touchEnd(el, { touches: [], changedTouches: at(to, 100 + dy) });
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

  it('ignores swipes that are not clearly one (DEF-30)', () => {
    const next = vi.fn();
    const previous = vi.fn();
    const { getByTestId } = render(<Story next={next} previous={previous} />);
    const text = getByTestId('text');
    swipe(text, 200, 150); // too short
    swipe(text, 300, 180, 1, 90); // too diagonal: a scroll
    swipe(text, 10, 300); // from the edge: the phone's own back gesture
    expect(next).not.toHaveBeenCalled();
    expect(previous).not.toHaveBeenCalled();
  });

  it('ignores slow drags (DEF-30)', () => {
    const previous = vi.fn();
    const now = vi.spyOn(performance, 'now');
    const { getByTestId } = render(<Story next={vi.fn()} previous={previous} />);
    now.mockReturnValueOnce(0).mockReturnValueOnce(1500);
    swipe(getByTestId('text'), 100, 300);
    now.mockRestore();
    expect(previous).not.toHaveBeenCalled();
  });

  it('leaves sideways swipes to a table that scrolls (DEF-30)', () => {
    const next = vi.fn();
    const { getByTestId } = render(<Story next={next} previous={vi.fn()} />);
    const table = getByTestId('table');
    Object.defineProperty(table, 'scrollWidth', { value: 800 });
    Object.defineProperty(table, 'clientWidth', { value: 300 });
    swipe(table, 300, 100);
    expect(next).not.toHaveBeenCalled();
  });
});
