import { render, screen } from '@testing-library/react';
import { ListaDatos } from './ListaDatos';

describe('ListaDatos', () => {
  it('relaciona cada término con su valor', () => {
    render(<ListaDatos datos={[{ termino: 'Fuente', valor: 'INE' }]} />);
    expect(screen.getByRole('term')).toHaveTextContent('Fuente');
    expect(screen.getByRole('definition')).toHaveTextContent('INE');
  });
});
