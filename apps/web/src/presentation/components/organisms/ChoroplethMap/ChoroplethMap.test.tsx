import { fireEvent, render, screen } from '@testing-library/react';
import { ChoroplethMap } from './ChoroplethMap';

const square = (x: number) =>
  [
    [
      [x, 0],
      [x + 1, 0],
      [x + 1, 1],
      [x, 1],
      [x, 0],
    ],
  ] as const;
const layer = {
  areas: [
    { id: 'a', name: 'Alto', rings: square(0) },
    { id: 'b', name: 'Bajo', rings: square(1) },
    { id: 'c', name: 'Sin dato', rings: square(2) },
  ],
  bounds: [0, 0, 3, 1] as const,
};
const values: Record<string, number | null> = { a: 0.8, b: 0.4, c: null };
const props = {
  layer,
  valueOf: (id: string) => values[id] ?? null,
  label: 'Participación por municipio, 2024',
  legendTitle: 'Participación 2024',
  format: (v: number) => `${Math.round(v * 100)} %`,
};

describe('ChoroplethMap', () => {
  it('is one named image with a legend from the lowest to the highest value', () => {
    render(<ChoroplethMap {...props} />);
    expect(
      screen.getByRole('img', { name: 'Participación por municipio, 2024' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Menor · 40 %')).toBeInTheDocument();
    expect(screen.getByText('80 % · Mayor')).toBeInTheDocument();
    expect(screen.getByText(/Sin dato/)).toBeInTheDocument();
  });

  it('colors with the scale and grey without data', () => {
    const { container } = render(<ChoroplethMap {...props} />);
    const fill = (id: string) => container.querySelector(`[data-id="${id}"]`)?.getAttribute('fill');
    expect(fill('a')).toBe('var(--rv-map-7)');
    expect(fill('b')).toBe('var(--rv-map-1)');
    expect(fill('c')).toBe('var(--rv-map-empty)');
  });

  it('shows the card of the highlighted area', () => {
    render(
      <ChoroplethMap
        {...props}
        highlight="a"
        tooltip={(id) => ({ title: id === 'a' ? 'Alto' : id, detail: '80 %' })}
      />,
    );
    expect(screen.getByText('Alto')).toBeInTheDocument();
    expect(screen.getByText('80 %')).toBeInTheDocument();
  });

  it('lets you choose an area with the keyboard when it is selectable', () => {
    const onSelect = vi.fn();
    render(<ChoroplethMap {...props} onSelect={onSelect} />);
    const bajo = screen.getByRole('button', { name: 'Bajo' });
    fireEvent.keyDown(bajo, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('zooms in and back to the whole map', () => {
    const { container } = render(<ChoroplethMap {...props} zoomable />);
    const box = () => container.querySelector('svg')?.getAttribute('viewBox');
    const all = box();
    fireEvent.click(screen.getByRole('button', { name: 'Acercar' }));
    expect(box()).not.toBe(all);
    fireEvent.click(screen.getByRole('button', { name: 'Ver todo' }));
    expect(box()).toBe(all);
  });
});
