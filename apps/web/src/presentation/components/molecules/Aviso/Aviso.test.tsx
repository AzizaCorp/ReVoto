import { render, screen } from '@testing-library/react';
import { Aviso } from './Aviso';

describe('Aviso', () => {
  it('un error se anuncia como alerta', () => {
    render(<Aviso tono="error">No pudimos cargar las cifras</Aviso>);
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar las cifras');
  });

  it('los demás tonos son notas', () => {
    render(<Aviso titulo="Datos pendientes">Las cifras aparecen como —.— %</Aviso>);
    expect(screen.getByRole('note')).toHaveTextContent('Datos pendientes');
  });
});
