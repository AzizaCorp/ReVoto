import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { memoryDependencies } from '@/test/memoryRepositories';
import { App as Root } from './App';
import { DependenciesProvider } from './providers/Dependencies';

const App = () => (
  <DependenciesProvider value={memoryDependencies()}>
    <Root />
  </DependenciesProvider>
);

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

  it('promises as many screens as the sequence has and counts them all (DEF-27)', () => {
    const { unmount } = render(<App />);
    expect(screen.getByText(/Descubre en 12 pantallas/)).toBeInTheDocument();
    unmount();
    window.location.hash = '#/W-09b';
    const { container } = render(<App />);
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Pantalla 10 de 12');
  });

  it('moves with the buttons and the → key and announces the progress (CA-02, CA-04)', () => {
    const { container } = render(<App />);
    expect(screen.queryByRole('button', { name: 'Pantalla siguiente' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Descubrir mi territorio' }));
    expect(title()).toHaveTextContent('¿Dónde votas?');
    expect(window.location.hash).toBe('#/W-02');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(title()).toHaveTextContent('Cuéntanos de ti');
    expect(screen.getByRole('button', { name: 'Pantalla anterior' })).toBeInTheDocument();
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Pantalla 2 de 12');
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

  it('names the source next to the figures and opens it from there (DEF-33)', () => {
    window.location.hash = '#/W-03';
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Fuente: INE/ }));
    expect(screen.getByRole('dialog', { name: '¿De dónde sale esta cifra?' })).toBeInTheDocument();
  });

  it('the cover has no source link: it shows no figures yet', () => {
    window.location.hash = '#/W-01';
    render(<App />);
    expect(screen.queryByRole('button', { name: /^Fuente: INE/ })).toBeNull();
  });

  it('the territory chip opens W-02 and comes back to the same screen (HU-28)', async () => {
    window.location.hash = '#/W-04';
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Cambiar territorio/ }));
    expect(title()).toHaveTextContent('¿Dónde votas?');
    fireEvent.click(await screen.findByRole('radio', { name: /Ciudad de México/ }));
    const select = screen.getByRole('combobox', { name: /Municipio/ });
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.change(select, { target: { value: '9-6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(title()).toHaveTextContent('Iztacalco, Ciudad de México');
    expect(await screen.findAllByText('69.4 %')).toHaveLength(2); // stat card + comparison bar
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
