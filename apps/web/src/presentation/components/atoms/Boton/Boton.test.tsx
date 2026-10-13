import { fireEvent, render, screen } from '@testing-library/react';
import { Boton } from './Boton';

describe('Boton', () => {
  it('es un botón con su nombre accesible y responde al clic', () => {
    const onClick = vi.fn();
    render(<Boton onClick={onClick}>Siguiente</Boton>);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('con href se dibuja como enlace', () => {
    render(<Boton href="#/W-10">Ver resumen</Boton>);
    expect(screen.getByRole('link', { name: 'Ver resumen' })).toHaveAttribute('href', '#/W-10');
  });
});
