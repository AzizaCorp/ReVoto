// End-to-end over the JSON files published in public/data: the same adapters as src/main.tsx.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { hasRealData, realDependencies } from '@/test/realData';
import { renderWithApp } from '@/test/renderWithApp';
import { App } from './App';
import { W15Lite } from './pages/W15Lite';
import { DependenciesProvider } from './providers/Dependencies';

const title = () => screen.getByRole('heading', { level: 1 });
const forward = () => fireEvent.keyDown(window, { key: 'ArrowRight' });

async function chooseIztacalco() {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ciudad' } });
  fireEvent.click(await screen.findByRole('radio', { name: /Ciudad de México/ }));
  const select = screen.getByRole('combobox', { name: /Municipio/ });
  await waitFor(() => expect(select).toBeEnabled());
  fireEvent.change(select, { target: { value: '6' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
}

describe.runIf(hasRealData)('The story with the published data (Iztacalco, CDMX)', () => {
  beforeEach(() => {
    window.location.hash = '#/W-02';
  });

  it('every screen shows the figures of the chosen municipality', async () => {
    render(
      <DependenciesProvider value={realDependencies()}>
        <App />
      </DependenciesProvider>,
    );
    await chooseIztacalco();
    expect(title()).toHaveTextContent('Cuéntanos de ti');

    forward(); // W-03
    expect(await screen.findByText('59.7 %')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Intermedia' }));
    expect(screen.getByText('51.8 %')).toBeInTheDocument();

    forward(); // W-04
    expect(title()).toHaveTextContent('Iztacalco, Ciudad de México');
    expect(await screen.findByText('+9.7 pts vs. nacional')).toBeInTheDocument();

    forward(); // W-05
    expect(title()).toHaveTextContent('En presidenciales se vota 24.8 pts más que en intermedias');
    expect(screen.getByText('69.3 %')).toBeInTheDocument();
    expect(screen.getByText('−1.8 pts')).toBeInTheDocument();

    forward(); // W-06: the age breakdown is published by state
    expect(title()).toHaveTextContent(
      'Quienes tienen 60 + votan 16.1 pts más que quienes tienen 18–24',
    );
    expect(screen.getByText(/mostramos Ciudad de México/)).toBeInTheDocument();

    forward(); // W-07
    expect(title()).toHaveTextContent('Las mujeres votan 8.4 pts más que los hombres');

    forward(); // W-08
    expect(title()).toHaveTextContent('Tu lugar en Ciudad de México');
    expect(screen.getByText('#10 de 16')).toBeInTheDocument();
    expect(screen.getByText(/Vota más que el 40 %/)).toBeInTheDocument();

    forward(); // W-09
    expect(title()).toHaveTextContent('Iztacalco es «De elección grande»');
    expect(
      screen.getByText('En presidenciales sube 11.0 pts más que el país.'),
    ).toBeInTheDocument();

    forward(); // W-09b (no answers)
    forward(); // W-09c
    forward(); // W-10
    expect(title()).toHaveTextContent('Lo esencial, en cinco cifras');
    for (const value of ['59.7 %', '69.4 %', '#10 de 16', '−16.1 pts', '+8.4 pts']) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
    expect(
      screen.getByRole('button', { name: 'Tu municipio: «De elección grande»' }),
    ).toBeInTheDocument();
  });

  it('the lite version reads the same data, badge comparison included', async () => {
    window.location.hash = '';
    await renderWithApp(<W15Lite />, realDependencies());
    const next = () => fireEvent.click(screen.getByRole('button', { name: 'Siguiente ›' }));
    next(); // W-02
    const [stateSelect, townSelect] = screen.getAllByRole('combobox');
    await waitFor(() => expect(within(stateSelect!).getAllByRole('option')).toHaveLength(33));
    fireEvent.change(stateSelect!, { target: { value: '9' } });
    await waitFor(() => expect(townSelect).toBeEnabled());
    fireEvent.change(townSelect!, { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(title()).toHaveTextContent('Cuéntanos de ti');
    const pick = (group: RegExp, option: string) =>
      fireEvent.click(
        within(screen.getByRole('group', { name: group })).getByRole('radio', { name: option }),
      );
    pick(/rango de edad/, '18–24');
    pick(/2018/, 'Sí');
    pick(/2021/, 'Sí');
    pick(/2024/, 'Sí');
    next(); // W-03
    next(); // W-04
    expect(await screen.findByRole('row', { name: /Iztacalco 69.4 %/ })).toBeInTheDocument();
    expect(
      screen.getByRole('row', { name: /Tus vecinos \(promedio\) 70.0 %/ }),
    ).toBeInTheDocument();
    for (let i = 0; i < 6; i++) next(); // W-09b
    expect(title()).toHaveTextContent('Tu insignia: «Fiel a la urna»');
    expect(
      screen.getByRole('row', { name: /18–24 en Ciudad de México 1.7 de 3/ }),
    ).toBeInTheDocument();
    next(); // W-09c
    expect(title()).toHaveTextContent('«SIN TEMPORADA»');
  });
});
