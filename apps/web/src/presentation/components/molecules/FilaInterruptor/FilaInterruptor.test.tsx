import { render, screen } from '@testing-library/react';
import { FilaInterruptor } from './FilaInterruptor';

describe('FilaInterruptor', () => {
  it('nombra el interruptor con su título', () => {
    render(<FilaInterruptor titulo="Versión ligera" activo onCambio={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Versión ligera' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
