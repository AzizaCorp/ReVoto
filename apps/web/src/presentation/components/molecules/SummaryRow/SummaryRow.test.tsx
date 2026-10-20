import { fireEvent, render, screen } from '@testing-library/react';
import { SummaryRow } from './SummaryRow';

describe('SummaryRow', () => {
  it('is a button named by its figure and context', () => {
    const onClick = vi.fn();
    render(<SummaryRow icon="chart" value="61.0 %" context="Nacional · 2024" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /61.0 %\s*Nacional · 2024/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
