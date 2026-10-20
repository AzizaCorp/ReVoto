import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('shows the label and the figure', () => {
    render(<StatCard label="Promedio presidencial" value="—.— %" pending />);
    expect(screen.getByText('Promedio presidencial')).toBeInTheDocument();
    expect(screen.getByText('—.— %')).toBeInTheDocument();
  });
});
