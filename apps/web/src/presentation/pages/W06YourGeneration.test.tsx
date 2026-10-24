import { act, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { municipality, type Territory } from '@/domain';
import { useNavigation } from '@/presentation/providers/Navigation';
import { renderWithApp } from '@/test/renderWithApp';
import { W06YourGeneration } from './W06YourGeneration';

const IZTACALCO = municipality(9, 6, 'Iztacalco', 'Ciudad de México') as Territory;

function WithMunicipality() {
  const nav = useNavigation();
  useEffect(() => {
    nav.chooseTerritory(IZTACALCO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <W06YourGeneration />;
}

describe('W-06 · Your generation', () => {
  it('with national figures it has no «Nacional | Nacional» selector (DEF-35)', async () => {
    await renderWithApp(<W06YourGeneration />);
    await act(async () => {});
    expect(screen.queryByRole('radiogroup', { name: 'Ámbito' })).toBeNull();
  });

  it('with a municipality it lets the person compare it with the country', async () => {
    await renderWithApp(<WithMunicipality />);
    await act(async () => {});
    const radios = screen.getAllByRole('radio');
    // The test data has no age breakdown for the municipality, so it falls back to its state.
    expect(radios.map((r) => r.textContent)).toEqual(['Ciudad de México', 'Nacional']);
  });
});
