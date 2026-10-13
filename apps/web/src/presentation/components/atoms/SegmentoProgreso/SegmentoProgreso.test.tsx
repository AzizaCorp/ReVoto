import { render } from '@testing-library/react';
import { SegmentoProgreso } from './SegmentoProgreso';

describe('SegmentoProgreso', () => {
  it('marca su estado y queda oculto para lectores de pantalla', () => {
    const { container } = render(<SegmentoProgreso activo />);
    const s = container.firstElementChild;
    expect(s).toHaveAttribute('data-activo', 'true');
    expect(s).toHaveAttribute('aria-hidden', 'true');
  });
});
