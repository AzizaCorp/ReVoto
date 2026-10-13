import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

const title = () => screen.getByRole('heading', { level: 1 });

describe('App · sequence engine', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('mounts the main region and starts on the cover', () => {
    render(<App />);
    expect(screen.getByRole('main', { name: 'ReVoto' })).toBeInTheDocument();
    expect(title()).toHaveTextContent('¿Cuánto vota tu territorio?');
  });

  it('moves with the buttons and the → key and announces the progress (CA-02, CA-04)', () => {
    const { container } = render(<App />);
    expect(screen.queryByRole('button', { name: 'Pantalla siguiente' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Descubrir mi territorio' }));
    expect(title()).toHaveTextContent('¿Dónde votas?');
    expect(window.location.hash).toBe('#/W-02');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(title()).toHaveTextContent('Cuéntanos de ti');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeInTheDocument();
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Pantalla 2 de 10');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(title()).toHaveTextContent('¿Dónde votas?');
  });

  it('opens a screen from the URL and the source sheet', () => {
    window.location.hash = '#/W-03';
    render(<App />);
    expect(title()).toHaveTextContent('Así vota México');
    // «Fuente» is in the bottom bar (mobile/tablet) and in the top bar (desktop).
    fireEvent.click(screen.getAllByRole('button', { name: 'Fuente' })[0]!);
    expect(screen.getByRole('dialog', { name: '¿De dónde sale esta cifra?' })).toBeInTheDocument();
  });

  it('the territory chip opens W-02 and comes back to the same screen (HU-28)', () => {
    window.location.hash = '#/W-04';
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Cambiar territorio/ }));
    expect(title()).toHaveTextContent('¿Dónde votas?');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(title()).toHaveTextContent('[Municipio], [Entidad]');
  });

  it('open data leads to the methodology, the dictionary and the quality report', () => {
    window.location.hash = '#/W-16';
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Metodología' }));
    expect(title()).toHaveTextContent('Metodología');
    fireEvent.click(screen.getByRole('button', { name: 'Reporte de calidad' }));
    expect(
      screen.getByRole('dialog', { name: 'Reporte de calidad y validación' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver metodología' }));
    fireEvent.click(screen.getByRole('button', { name: 'Datos abiertos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Diccionario de datos' }));
    expect(title()).toHaveTextContent('Diccionario de datos');
    expect(
      screen.getByRole('table', { name: /Participación por entidad y municipio/ }),
    ).toBeInTheDocument();
  });
});
