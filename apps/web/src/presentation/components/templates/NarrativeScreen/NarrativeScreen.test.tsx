import { render, screen } from '@testing-library/react';
import { NarrativeScreen } from './NarrativeScreen';

describe('NarrativeScreen', () => {
  it('lays out the three zones and the visualization', () => {
    render(
      <NarrativeScreen
        top={<header>arriba</header>}
        bottom={<nav>abajo</nav>}
        visual={<div>mapa</div>}
      >
        <h1>Así vota México</h1>
      </NarrativeScreen>,
    );
    expect(screen.getByText('arriba')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Así vota México' })).toBeInTheDocument();
    expect(screen.getByText('mapa')).toBeInTheDocument();
    expect(screen.getByText('abajo')).toBeInTheDocument();
  });
});
