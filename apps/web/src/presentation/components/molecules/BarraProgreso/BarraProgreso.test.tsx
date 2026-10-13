import { render, screen } from '@testing-library/react';
import { BarraProgreso } from './BarraProgreso';

describe('BarraProgreso', () => {
  it('dibuja un segmento por paso y marca los recorridos', () => {
    const { container } = render(
      <BarraProgreso posicion={4} total={10} texto="Pantalla 4 de 10" />,
    );
    expect(container.querySelectorAll('[data-activo]')).toHaveLength(10);
    expect(container.querySelectorAll('[data-activo="true"]')).toHaveLength(4);
    expect(screen.getByText('Pantalla 4 de 10')).toBeInTheDocument();
  });
});
