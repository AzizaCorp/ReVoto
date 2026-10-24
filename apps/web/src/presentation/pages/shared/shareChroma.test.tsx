import { screen } from '@testing-library/react';
import { renderWithApp } from '@/test/renderWithApp';
import { W04YourTerritory } from '../W04YourTerritory';
import { W10Summary } from '../W10Summary';

describe('US-24 · chroma of the share buttons', () => {
  it('the data screens call attention to «Compartir» in the top and bottom bars', async () => {
    await renderWithApp(<W04YourTerritory />);
    const buttons = screen.getAllByRole('button', { name: 'Compartir' });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    for (const b of buttons) expect(b).toHaveAttribute('data-chroma', 'fucsia');
    expect(screen.getAllByRole('button', { name: 'Fuente' })[0]).not.toHaveAttribute('data-chroma');
  });

  it('«Compartir mi resumen» uses its own color', async () => {
    await renderWithApp(<W10Summary />);
    expect(screen.getByRole('button', { name: /Compartir mi resumen/ })).toHaveAttribute(
      'data-chroma',
      'oro',
    );
  });
});
