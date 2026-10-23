import { fireEvent, render, screen } from '@testing-library/react';
import { ChartTable } from './ChartTable';

const table = {
  caption: 'Participación por elección',
  head: ['Elección', 'Participación'],
  rows: [
    ['2018', '63.4 %'],
    ['2024', '61.0 %'],
  ],
  highlight: '2024',
};

describe('ChartTable', () => {
  it('shows the chart and swaps it for its table in the same place (DEF-24)', () => {
    render(
      <ChartTable table={table}>
        <p>gráfica</p>
      </ChartTable>,
    );
    expect(screen.getByText('gráfica')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver como tabla' }));
    expect(screen.queryByText('gráfica')).toBeNull();
    const t = screen.getByRole('table', { name: 'Participación por elección' });
    expect(t.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(screen.getByRole('rowheader', { name: '2024' }).closest('tr')?.className).toMatch(/me/);
    fireEvent.click(screen.getByRole('button', { name: 'Ver como gráfica' }));
    expect(screen.getByText('gráfica')).toBeInTheDocument();
  });
});
