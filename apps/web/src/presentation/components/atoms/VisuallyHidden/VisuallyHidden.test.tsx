import { render, screen } from '@testing-library/react';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('keeps the text in the accessibility tree', () => {
    render(<VisuallyHidden>Pantalla 4 de 10</VisuallyHidden>);
    expect(screen.getByText('Pantalla 4 de 10')).toBeInTheDocument();
  });
});
