import { render, screen } from '@testing-library/react';
import { BotonIcono } from './BotonIcono';

describe('BotonIcono', () => {
  it('expone su etiqueta como nombre accesible', () => {
    render(<BotonIcono etiqueta="Ajustes de lectura">Aa</BotonIcono>);
    expect(screen.getByRole('button', { name: 'Ajustes de lectura' })).toBeInTheDocument();
  });
});
