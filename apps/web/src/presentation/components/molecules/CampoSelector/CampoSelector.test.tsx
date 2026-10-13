import { fireEvent, render, screen } from '@testing-library/react';
import { CampoSelector } from './CampoSelector';

describe('CampoSelector', () => {
  it('asocia la etiqueta visible al select', () => {
    const onCambio = vi.fn();
    render(
      <CampoSelector
        etiqueta="Entidad"
        opciones={[{ valor: '14', texto: 'Jalisco' }]}
        valor=""
        onCambio={onCambio}
      />,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Entidad' }), {
      target: { value: '14' },
    });
    expect(onCambio).toHaveBeenCalledWith('14');
  });
});
