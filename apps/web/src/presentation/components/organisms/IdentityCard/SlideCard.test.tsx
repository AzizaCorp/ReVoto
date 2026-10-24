import { render, screen, within } from '@testing-library/react';
import { SlideCard } from './SlideCard';

const bars = ['2009', '2012', '2015', '2018', '2021', '2024'].map((y, i) => ({
  label: y,
  value: `${50 + i}.0 %`,
  ratio: 0.5 + i / 100,
  kind: i % 2 ? ('presidential' as const) : ('midterm' as const),
}));

const props = {
  theme: 'W-05' as const,
  chip: 'QUINCE AÑOS · 2009–2024',
  kicker: 'LAS PRESIDENCIALES SUMAN…',
  figure: '26.4 pts',
  figureCaption: 'más participación que las intermedias',
  title: 'Presidenciales 69.3 % · intermedias 44.5 %',
  bars,
  place: 'Iztacalco, Ciudad de México',
  period: '2009–2024',
};

describe('SlideCard', () => {
  it('is a readable figure with the territory, the period and the source', () => {
    render(<SlideCard {...props} />);
    const card = screen.getByRole('figure', { name: /26\.4 pts más participación/ });
    expect(card).toHaveAccessibleName(/Iztacalco, Ciudad de México, 2009–2024/);
    expect(card).toHaveTextContent('Conteos Censales de Participación Ciudadana (CCPC) 2009–2024');
    expect(within(card).getAllByRole('listitem')).toHaveLength(6);
  });

  it('the 1:1 card keeps the figure and leaves out a long list of bars', () => {
    render(<SlideCard {...props} format="post" />);
    const card = screen.getByRole('figure');
    expect(card).toHaveTextContent('26.4 pts');
    expect(within(card).queryAllByRole('listitem')).toHaveLength(0);
    expect(card).toHaveTextContent('INE · CCPC 2009–2024');
  });
});
