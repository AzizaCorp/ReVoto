import { render } from '@testing-library/react';
import { IconBubble } from './IconBubble';

describe('IconBubble', () => {
  it('is decorative and takes the requested size', () => {
    const { container } = render(<IconBubble icon="pin" size={40} />);
    const bubble = container.firstElementChild as HTMLElement;
    expect(bubble).toHaveAttribute('aria-hidden', 'true');
    expect(bubble.style.width).toBe('40px');
  });
});
