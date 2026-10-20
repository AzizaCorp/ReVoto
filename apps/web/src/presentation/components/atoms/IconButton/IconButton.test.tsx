import { render, screen } from '@testing-library/react';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('exposes its label as the accessible name', () => {
    render(<IconButton label="Ajustes de lectura">Aa</IconButton>);
    expect(screen.getByRole('button', { name: 'Ajustes de lectura' })).toBeInTheDocument();
  });
});
