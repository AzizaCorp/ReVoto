import { fireEvent, render, screen } from '@testing-library/react';
import { BarraSuperior } from './BarraSuperior';

describe('BarraSuperior', () => {
  it('muestra logotipo, progreso y el acceso a ajustes', () => {
    const onAjustes = vi.fn();
    render(
      <BarraSuperior
        progreso={{ posicion: 3, total: 10, texto: 'Pantalla 3 de 10' }}
        nombrePaso="México votó"
        onAjustes={onAjustes}
      />,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'ReVoto' })).toBeInTheDocument();
    expect(screen.getByText('Pantalla 3 de 10')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes de lectura' }));
    expect(onAjustes).toHaveBeenCalledOnce();
  });

  it('sin progreso no dibuja la barra', () => {
    render(<BarraSuperior onAjustes={() => {}} />);
    expect(screen.queryByText(/Pantalla/)).not.toBeInTheDocument();
  });
});
