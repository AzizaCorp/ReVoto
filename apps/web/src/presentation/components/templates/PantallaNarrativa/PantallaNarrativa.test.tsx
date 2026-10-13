import { render, screen } from '@testing-library/react';
import { PantallaNarrativa } from './PantallaNarrativa';

describe('PantallaNarrativa', () => {
  it('acomoda las tres zonas y la visualización', () => {
    render(
      <PantallaNarrativa
        superior={<header>arriba</header>}
        inferior={<nav>abajo</nav>}
        visual={<div>mapa</div>}
      >
        <h1>Así vota México</h1>
      </PantallaNarrativa>,
    );
    expect(screen.getByText('arriba')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Así vota México' })).toBeInTheDocument();
    expect(screen.getByText('mapa')).toBeInTheDocument();
    expect(screen.getByText('abajo')).toBeInTheDocument();
  });
});
