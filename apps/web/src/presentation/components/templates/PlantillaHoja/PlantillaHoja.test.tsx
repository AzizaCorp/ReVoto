import { render, screen } from '@testing-library/react';
import { PlantillaHoja } from './PlantillaHoja';

describe('PlantillaHoja', () => {
  it('dibuja la hoja con sus acciones', () => {
    render(
      <PlantillaHoja
        abierta
        titulo="Comparte este dato"
        onCerrar={() => {}}
        acciones={<button>Compartir…</button>}
      >
        vista previa
      </PlantillaHoja>,
    );
    expect(screen.getByRole('dialog', { name: 'Comparte este dato' })).toHaveTextContent(
      'vista previa',
    );
    expect(screen.getByRole('button', { name: 'Compartir…' })).toBeInTheDocument();
  });
});
