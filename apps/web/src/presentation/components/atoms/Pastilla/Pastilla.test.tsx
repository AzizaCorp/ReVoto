import { render, screen } from '@testing-library/react';
import { Pastilla } from './Pastilla';

describe('Pastilla', () => {
  it('muestra número y texto', () => {
    render(<Pastilla numero="2/9">México</Pastilla>);
    expect(screen.getByText('2/9')).toBeInTheDocument();
    expect(screen.getByText('México')).toBeInTheDocument();
  });
});
