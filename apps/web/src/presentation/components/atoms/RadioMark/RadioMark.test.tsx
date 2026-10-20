import { render } from '@testing-library/react';
import { RadioMark } from './RadioMark';

describe('RadioMark', () => {
  it('only draws the check when it is marked', () => {
    const { container, rerender } = render(<RadioMark checked={false} />);
    expect(container.querySelector('svg')).toBeNull();
    rerender(<RadioMark checked />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
