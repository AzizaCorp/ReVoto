import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('tiene texto alternativo', () => {
    render(<Logo />);
    expect(screen.getByRole('img', { name: 'ReVoto' })).toBeInTheDocument();
  });
});
