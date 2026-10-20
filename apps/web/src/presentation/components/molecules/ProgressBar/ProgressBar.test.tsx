import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('draws one segment per step and marks the visited ones', () => {
    const { container } = render(<ProgressBar position={4} total={10} text="Pantalla 4 de 10" />);
    expect(container.querySelectorAll('[data-active]')).toHaveLength(10);
    expect(container.querySelectorAll('[data-active="true"]')).toHaveLength(4);
    expect(screen.getByText('Pantalla 4 de 10')).toBeInTheDocument();
  });
});
