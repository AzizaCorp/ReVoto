import { render, screen } from '@testing-library/react';
import { ComparisonBar } from './ComparisonBar';

describe('ComparisonBar', () => {
  it('shows label and value, with no fill while there is no data', () => {
    const { container } = render(<ComparisonBar label="Tú" value="—.— de 3" ratio={null} />);
    expect(screen.getByText('Tú')).toBeInTheDocument();
    expect(screen.getByText('—.— de 3')).toBeInTheDocument();
    expect(container.querySelector('i')).toBeNull();
  });
});
