import { fireEvent, render, screen } from '@testing-library/react';
import { PantallaLigera } from './PantallaLigera';

describe('PantallaLigera', () => {
  it('permite volver a la versión completa', () => {
    const onVersionCompleta = vi.fn();
    render(<PantallaLigera onVersionCompleta={onVersionCompleta}>texto</PantallaLigera>);
    fireEvent.click(screen.getByRole('button', { name: 'Versión completa' }));
    expect(onVersionCompleta).toHaveBeenCalledOnce();
  });
});
