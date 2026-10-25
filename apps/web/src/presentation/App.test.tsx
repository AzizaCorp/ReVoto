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

  it('plays the top bar fill in reverse when going back (DEF-29)', () => {
    window.location.hash = '#/W-04';
    const { container } = render(<App />);
    const bar = () => container.querySelector('[data-direction]');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(bar()).toHaveAttribute('data-direction', 'forward');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(bar()).toHaveAttribute('data-direction', 'back');
    expect(container.querySelectorAll('[data-leaving]')).toHaveLength(1);
  });

  it('goes back to the screen of origin after editing the answers (DEF-25)', () => {
    window.location.hash = '#/W-09b';
    render(<App />);
    expect(title()).toHaveTextContent('Y tú, ¿cómo votas?');
    fireEvent.click(screen.getByRole('button', { name: 'Responder ahora' }));
    expect(title()).toHaveTextContent('Cuéntanos de ti');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y volver' }));
    expect(title()).toHaveTextContent('Y tú, ¿cómo votas?');
    expect(window.location.hash).toBe('#/W-09b');
  });

  it('moves on from «Sobre ti» when it was reached in order', () => {
    window.location.hash = '#/W-02b';
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));
    expect(title()).toHaveTextContent('Así vota México');
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
    expect(screen.getByRole('table', { name: /Participación por territorio/ })).toBeInTheDocument();
  });

  it('documents source, coverage, cut-off and quality of the published data (US-07)', () => {
    window.location.hash = '#/W-19';
    const { unmount } = render(<App />);
    expect(screen.getByText(/INE · Conteos censales \(LN, SV, NS\)/)).toBeInTheDocument();
    expect(screen.getByText(/2,451 municipios/)).toBeInTheDocument();
    expect(screen.getByText(/Jornada de cada elección/)).toBeInTheDocument();
    unmount();

    window.location.hash = '#/W-18';
    const { container } = render(<App />);
    const noData = screen.getByRole('table', { name: /Registros sin dato/ });
    expect(noData.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(noData).toHaveTextContent('6.83 %');
    fireEvent.click(screen.getByRole('button', { name: /Qué se excluye/ }));
    expect(screen.getByRole('table', { name: 'Reglas de calidad' })).toHaveTextContent(
      '105 personas',
    );
    // No template placeholders left on the methodology.
    expect(container.textContent).not.toMatch(/\[(umbral|dd\/mm\/aaaa|AAAAMMDD-hash|—\.—)\]/);
  });
});

describe('App · shared links (US-24)', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('opens the screen with the territory and the answers of the link, then cleans the URL', async () => {
    window.location.hash = '#/W-04?t=9-6&r=1010';
    render(<App />);
    await waitFor(() => expect(title()).toHaveTextContent('Iztacalco, Ciudad de México'));
    expect(window.location.hash).toBe('#/W-04');
    window.location.hash = '#/W-02b';
    await waitFor(() => expect(title()).toHaveTextContent('Cuéntanos de ti'));
    expect(screen.getByRole('button', { name: '25–34', pressed: true })).toBeInTheDocument();
  });

  it('a link to an unknown territory opens the screen with the national figures', async () => {
    window.location.hash = '#/W-04?t=40';
    render(<App />);
    await waitFor(() => expect(window.location.hash).toBe('#/W-04'));
    expect(title()).not.toHaveTextContent('Iztacalco');
  });
});
