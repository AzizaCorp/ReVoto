import { fireEvent, render, screen } from '@testing-library/react';
import { BarraInferior } from './BarraInferior';

describe('BarraInferior', () => {
  it('avanza y abre la fuente', () => {
    const onSiguiente = vi.fn();
    const onFuente = vi.fn();
    render(<BarraInferior onFuente={onFuente} onAnterior={null} onSiguiente={onSiguiente} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pantalla siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fuente' }));
    expect(onSiguiente).toHaveBeenCalledOnce();
    expect(onFuente).toHaveBeenCalledOnce();
  });

  it('en el primer paso «anterior» está deshabilitado', () => {
    render(<BarraInferior onAnterior={null} onSiguiente={() => {}} />);
    expect(screen.getByRole('button', { name: 'Pantalla anterior' })).toBeDisabled();
  });
});
