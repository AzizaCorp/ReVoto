import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

const titulo = () => screen.getByRole('heading', { level: 1 });

describe('App · motor de secuencia', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('monta la región principal y empieza en la portada', () => {
    render(<App />);
    expect(screen.getByRole('main', { name: 'ReVoto' })).toBeInTheDocument();
    expect(titulo()).toHaveTextContent('¿Cuánto vota tu territorio?');
  });

  it('avanza con el botón y con la flecha → y anuncia el progreso (CA-02, CA-04)', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Pantalla siguiente' }));
    expect(titulo()).toHaveTextContent('¿Dónde votas?');
    expect(window.location.hash).toBe('#/W-02');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(titulo()).toHaveTextContent('Cuéntanos de ti');
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Pantalla 2 de 10');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(titulo()).toHaveTextContent('¿Dónde votas?');
  });

  it('abre una pantalla desde la URL y la hoja de fuente', () => {
    window.location.hash = '#/W-03';
    render(<App />);
    expect(titulo()).toHaveTextContent('Así vota México');
    // «Fuente» está en la barra inferior (móvil/tablet) y en la superior (escritorio).
    fireEvent.click(screen.getAllByRole('button', { name: 'Fuente' })[0]!);
    expect(screen.getByRole('dialog', { name: '¿De dónde sale esta cifra?' })).toBeInTheDocument();
  });

  it('el chip de territorio abre W-02 y regresa a la misma pantalla (HU-28)', () => {
    window.location.hash = '#/W-04';
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Cambiar territorio/ }));
    expect(titulo()).toHaveTextContent('¿Dónde votas?');
    fireEvent.click(screen.getByRole('button', { name: 'Ver mis cifras' }));
    expect(titulo()).toHaveTextContent('[Municipio], [Entidad]');
  });
});
