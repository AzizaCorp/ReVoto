import { fireEvent, render, screen } from '@testing-library/react';
import { SearchField } from './SearchField';

describe('SearchField', () => {
  it('is a named search box that reports what is typed', () => {
    const onChange = vi.fn();
    render(<SearchField label="Buscar entidad o municipio" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar entidad o municipio' }), {
      target: { value: 'Jal' },
    });
    expect(onChange).toHaveBeenCalledWith('Jal');
  });
});
