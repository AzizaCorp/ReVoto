import { render, screen } from '@testing-library/react';
import { Slot } from './Slot';

describe('Slot', () => {
  it('without content shows its label in brackets', () => {
    render(<Slot label="Mapa por municipio" />);
    expect(screen.getByText('[Mapa por municipio]')).toBeInTheDocument();
  });

  it('with content shows the sample text', () => {
    render(<Slot label="Participación nacional">—.— %</Slot>);
    expect(screen.getByText('—.— %')).toBeInTheDocument();
  });
});
