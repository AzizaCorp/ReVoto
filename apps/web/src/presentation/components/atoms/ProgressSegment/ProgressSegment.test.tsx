import { render } from '@testing-library/react';
import { ProgressSegment } from './ProgressSegment';

describe('ProgressSegment', () => {
  it('flags its state and stays hidden from screen readers', () => {
    const { container } = render(<ProgressSegment active />);
    const s = container.firstElementChild;
    expect(s).toHaveAttribute('data-active', 'true');
    expect(s).toHaveAttribute('aria-hidden', 'true');
  });
});
