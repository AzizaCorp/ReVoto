import { render, screen } from '@testing-library/react';
import { OcultoVisual } from './OcultoVisual';

describe('OcultoVisual', () => {
  it('mantiene el texto en el árbol accesible', () => {
    render(<OcultoVisual>Pantalla 4 de 10</OcultoVisual>);
    expect(screen.getByText('Pantalla 4 de 10')).toBeInTheDocument();
  });
});
