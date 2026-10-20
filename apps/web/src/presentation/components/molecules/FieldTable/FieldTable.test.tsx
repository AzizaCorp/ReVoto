import { render, screen } from '@testing-library/react';
import { FieldTable } from './FieldTable';

describe('FieldTable', () => {
  it('is a captioned table with one row header per field', () => {
    render(
      <FieldTable
        caption="Campos de participación"
        fields={[
          { name: 'anio', type: 'entero', description: 'Año de la elección', example: '2024' },
        ]}
      />,
    );
    expect(screen.getByRole('table', { name: 'Campos de participación' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'anio' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  });
});
