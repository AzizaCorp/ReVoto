import { fireEvent, render, screen } from '@testing-library/react';
import { VistaEstado } from './VistaEstado';

describe('VistaEstado', () => {
  it('error: anuncia el motivo y permite reintentar (US-09 CA-05)', () => {
    const onReintentar = vi.fn();
    render(<VistaEstado estado="error" territorio="Jalisco" onReintentar={onReintentar} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar las cifras de Jalisco.');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onReintentar).toHaveBeenCalledOnce();
  });

  it('umbral: explica por qué se muestra la entidad (RN-05)', () => {
    render(<VistaEstado estado="umbral" />);
    expect(screen.getByRole('note')).toHaveTextContent('muy pocos registros');
  });
});
