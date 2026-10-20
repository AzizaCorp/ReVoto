import { fireEvent, render, screen } from '@testing-library/react';
import { SelectField } from './SelectField';

describe('SelectField', () => {
  it('ties the visible label to the select', () => {
    const onChange = vi.fn();
    render(
      <SelectField
        label="Entidad"
        options={[{ value: '14', text: 'Jalisco' }]}
        value=""
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Entidad' }), {
      target: { value: '14' },
    });
    expect(onChange).toHaveBeenCalledWith('14');
  });
});
