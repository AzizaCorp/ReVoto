import { fireEvent, render, screen } from '@testing-library/react';
import { HojaInferior } from './HojaInferior';

describe('HojaInferior', () => {
  it('es un diálogo con título, recibe el foco y cierra con Escape', () => {
    const onCerrar = vi.fn();
    render(
      <HojaInferior abierta titulo="¿De dónde sale esta cifra?" onCerrar={onCerrar}>
        contenido
      </HojaInferior>,
    );
    const hoja = screen.getByRole('dialog', { name: '¿De dónde sale esta cifra?' });
    expect(hoja).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledOnce();
  });

  it('cerrada no dibuja nada', () => {
    render(
      <HojaInferior abierta={false} titulo="Ajustes" onCerrar={() => {}}>
        x
      </HojaInferior>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
