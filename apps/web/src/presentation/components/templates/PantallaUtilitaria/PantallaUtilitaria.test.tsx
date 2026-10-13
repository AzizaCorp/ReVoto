import { fireEvent, render, screen } from '@testing-library/react';
import { PantallaUtilitaria } from './PantallaUtilitaria';

describe('PantallaUtilitaria', () => {
  it('muestra título, volver y acción', () => {
    const onVolver = vi.fn();
    render(
      <PantallaUtilitaria
        titulo="Datos abiertos"
        onVolver={onVolver}
        accion={<button>Descargar</button>}
      >
        contenido
      </PantallaUtilitaria>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Datos abiertos' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '‹ Volver' }));
    expect(onVolver).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Descargar' })).toBeInTheDocument();
  });
});
