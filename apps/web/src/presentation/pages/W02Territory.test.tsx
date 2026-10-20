import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createSequence } from '@/domain';
import { DependenciesProvider } from '@/presentation/providers/Dependencies';
import { NavigationProvider, useNavigation } from '@/presentation/providers/Navigation';
import { memoryDependencies, memoryTurnoutRepository } from '@/test/memoryRepositories';
import { W02Territory } from './W02Territory';

function Chosen() {
  return <output>{useNavigation().territory}</output>;
}

const renderW02 = (deps = memoryDependencies()) =>
  render(
    <DependenciesProvider value={deps}>
      <NavigationProvider sequence={createSequence()}>
        <W02Territory />
        <Chosen />
      </NavigationProvider>
    </DependenciesProvider>,
  );

describe('W-02 · Choose your territory', () => {
  beforeEach(() => {
    window.location.hash = '#/W-02';
  });

  it('lists the states from the repository and its municipalities once one is chosen', async () => {
    renderW02();
    const select = screen.getByRole('combobox', { name: /Municipio/ });
    expect(select).toBeDisabled();
    fireEvent.click(await screen.findByRole('radio', { name: /Ciudad de México/ }));
    await waitFor(() => expect(select).toBeEnabled());
    expect(screen.getByRole('option', { name: 'Iztacalco' })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: '9-6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Ciudad de México · Iztacalco');
  });

  it('«Usar cifras nacionales» chooses the country', async () => {
    renderW02();
    fireEvent.click(await screen.findByRole('radio', { name: /Jalisco/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Usar cifras nacionales' }));
    expect(screen.getByRole('status')).toHaveTextContent('Nacional');
  });

  it('offers a retry when the catalogue cannot be read (W-17)', async () => {
    const turnout = memoryTurnoutRepository({ states: () => Promise.reject(new Error('red')) });
    renderW02({ ...memoryDependencies(), turnout });
    expect(await screen.findByText('No pudimos cargar las entidades')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
