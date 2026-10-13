import { fireEvent, render, screen } from '@testing-library/react';
import { Interruptor } from './Interruptor';

describe('Interruptor', () => {
  it('es un switch con estado y cambia al presionarlo', () => {
    const onCambio = vi.fn();
    render(
      <>
        <span id="t">Lectura fácil</span>
        <Interruptor etiquetadoPor="t" activo={false} onCambio={onCambio} />
      </>,
    );
    const s = screen.getByRole('switch', { name: 'Lectura fácil' });
    expect(s).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(s);
    expect(onCambio).toHaveBeenCalledWith(true);
  });
});
