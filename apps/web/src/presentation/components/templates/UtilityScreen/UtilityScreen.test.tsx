import { fireEvent, render, screen } from '@testing-library/react';
import { UtilityScreen } from './UtilityScreen';

describe('UtilityScreen', () => {
  it('shows the title, the back button and the actions', () => {
    const onBack = vi.fn();
    render(
      <UtilityScreen title="Datos abiertos" onBack={onBack} actions={<button>Descargar</button>}>
        contenido
      </UtilityScreen>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Datos abiertos' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Descargar' })).toBeInTheDocument();
  });
});
