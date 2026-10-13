import { render, screen } from '@testing-library/react';
import { Texto } from './Texto';

describe('Texto', () => {
  it('h1 es un encabezado de nivel 1 que puede recibir foco', () => {
    render(<Texto rol="h1">Así vota México</Texto>);
    const h = screen.getByRole('heading', { level: 1, name: 'Así vota México' });
    expect(h).toHaveAttribute('tabindex', '-1');
  });

  it('cuerpo es un párrafo', () => {
    render(<Texto rol="cuerpo">Texto de apoyo</Texto>);
    expect(screen.getByText('Texto de apoyo').tagName).toBe('P');
  });
});
