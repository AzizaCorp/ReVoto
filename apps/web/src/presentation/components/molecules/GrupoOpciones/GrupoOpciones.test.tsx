import { fireEvent, render, screen } from '@testing-library/react';
import { GrupoOpciones } from './GrupoOpciones';

describe('GrupoOpciones', () => {
  it('marca la opción elegida con aria-pressed', () => {
    const onElegir = vi.fn();
    render(
      <GrupoOpciones
        pregunta="¿Votaste en 2024?"
        opciones={['Sí', 'No']}
        seleccion="Sí"
        onElegir={onElegir}
      />,
    );
    expect(screen.getByRole('group', { name: '¿Votaste en 2024?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sí' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onElegir).toHaveBeenCalledWith('No');
  });
});
