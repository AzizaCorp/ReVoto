import { render } from '@testing-library/react';
import { Illustration } from './Illustration';

describe('Illustration', () => {
  it('is decorative by default', () => {
    const { container } = render(<Illustration src="urna.svg" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});
