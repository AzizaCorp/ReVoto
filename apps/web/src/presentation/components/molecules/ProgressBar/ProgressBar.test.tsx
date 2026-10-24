import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('draws one segment per step and marks the visited ones', () => {
    const { container } = render(<ProgressBar position={4} total={10} text="Pantalla 4 de 10" />);
    expect(container.querySelectorAll('[data-active]')).toHaveLength(10);
    expect(container.querySelectorAll('[data-active="true"]')).toHaveLength(4);
    expect(screen.getByText('Pantalla 4 de 10')).toBeInTheDocument();
  });

  it('empties the segment just left when going back (DEF-29)', () => {
    const { container } = render(
      <ProgressBar position={4} total={10} text="Pantalla 4 de 10" direction="back" />,
    );
    const leaving = container.querySelectorAll('[data-leaving]');
    expect(leaving).toHaveLength(1);
    expect(leaving[0]).toBe(container.querySelectorAll('[data-active]')[4]);
  });

  it('only fills a segment when moving forward', () => {
    const { container } = render(<ProgressBar position={4} total={10} text="Pantalla 4 de 10" />);
    expect(container.querySelectorAll('[data-leaving]')).toHaveLength(0);
  });
});
