import { render, screen } from '@testing-library/react';
import { DataList } from './DataList';

describe('DataList', () => {
  it('pairs every term with its value', () => {
    render(<DataList items={[{ term: 'Fuente', value: 'INE' }]} />);
    expect(screen.getByRole('term')).toHaveTextContent('Fuente');
    expect(screen.getByRole('definition')).toHaveTextContent('INE');
  });
});
