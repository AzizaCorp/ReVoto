import { render } from '@testing-library/react';
import { ICON_NAMES, Icon } from './Icon';

describe('Icon', () => {
  it('is decorative: hidden from assistive technology', () => {
    const { container } = render(<Icon name="arrow" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(ICON_NAMES)('draws «%s»', (name) => {
    const { container } = render(<Icon name={name} />);
    expect(container.querySelector('path')?.getAttribute('d')).toBeTruthy();
  });
});
