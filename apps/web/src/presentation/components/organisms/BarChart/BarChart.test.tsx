import { render, screen } from '@testing-library/react';
import { BarChart } from './BarChart';

describe('BarChart', () => {
  it('names the chart and lists every value for screen readers', () => {
    render(
      <BarChart
        title="Participación por elección"
        bars={[
          { label: '2018', value: '63.4', ratio: 0.63, kind: 'presidential' },
          { label: '2021', value: '—.—', ratio: null, kind: 'midterm' },
        ]}
      />,
    );
    expect(screen.getByRole('figure', { name: 'Participación por elección' })).toBeInTheDocument();
    expect(screen.getByText('2021, intermedia: —.—')).toBeInTheDocument();
  });
});
