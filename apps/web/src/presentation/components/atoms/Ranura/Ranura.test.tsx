import { render, screen } from '@testing-library/react';
import { Ranura } from './Ranura';

describe('Ranura', () => {
  it('sin contenido muestra su etiqueta entre corchetes', () => {
    render(<Ranura etiqueta="Mapa por municipio" />);
    expect(screen.getByText('[Mapa por municipio]')).toBeInTheDocument();
  });

  it('con contenido muestra el texto de muestra', () => {
    render(<Ranura etiqueta="Participación nacional">—.— %</Ranura>);
    expect(screen.getByText('—.— %')).toBeInTheDocument();
  });
});
