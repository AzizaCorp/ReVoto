import { fireEvent, render, screen } from '@testing-library/react';
import { createSequence } from '@/domain';
import { NavigationProvider } from '@/presentation/providers/Navigation';
import { ProfileProvider } from '@/presentation/providers/Profile';
import { W15Lite } from './W15Lite';

const renderLite = () =>
  render(
    <ProfileProvider>
      <NavigationProvider sequence={createSequence()}>
        <W15Lite />
      </NavigationProvider>
    </ProfileProvider>,
  );
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Siguiente ›' }));
const heading = () => screen.getByRole('heading', { level: 1 }).textContent;

describe('W-15 · Lite version', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('tells the whole story screen by screen, as text and tables', () => {
    renderLite();
    expect(heading()).toBe('¿Cuánto vota tu territorio?');
    next(); // W-02
    expect(screen.getByRole('combobox', { name: 'Entidad' })).toBeInTheDocument();
    next(); // W-02b
    next(); // W-03
    expect(heading()).toBe('Así vota México');
    expect(screen.getByRole('table', { name: /Participación nacional/ })).toBeInTheDocument();
    expect(screen.getByText(/Pantalla 3 de 10 · México/)).toBeInTheDocument();
  });

  it('ends at the summary with «Fin» and no images', () => {
    const { container } = renderLite();
    for (let i = 0; i < 12; i++) next();
    expect(heading()).toBe('Lo esencial, en cinco cifras');
    expect(screen.getByText('Fin')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente ›' })).toBeNull();
    expect(container.querySelector('img, svg, canvas')).toBeNull();
  });

  it('assigns the badge from the native radios of «Sobre ti»', () => {
    renderLite();
    next();
    next(); // W-02b
    for (const year of ['2018', '2021', '2024']) {
      const group = screen.getByRole('group', { name: new RegExp(`Votaste en ${year}`) });
      fireEvent.click(
        [...group.querySelectorAll('label')]
          .find((l) => l.textContent === 'Sí')!
          .querySelector('input')!,
      );
    }
    for (let i = 0; i < 8; i++) next(); // W-09b
    expect(heading()).toBe('Tu insignia: «Fiel a la urna»');
    expect(screen.getByRole('row', { name: /Tú 3 de 3/ })).toBeInTheDocument();
  });

  it('keeps W-09b and W-09c visible without answers', () => {
    renderLite();
    for (let i = 0; i < 10; i++) next(); // W-09b
    expect(heading()).toBe('Aún sin insignia');
    next();
    expect(heading()).toBe('Tu municipio ya tiene su mitad');
    expect(screen.getByText('Mi municipio es «[Arquetipo]»; falta mi parte.')).toBeInTheDocument();
  });

  it('«cambiar» goes back to the territory step', () => {
    renderLite();
    for (let i = 0; i < 4; i++) next();
    fireEvent.click(screen.getByRole('button', { name: 'cambiar' }));
    expect(heading()).toBe('¿Dónde votas?');
  });
});
