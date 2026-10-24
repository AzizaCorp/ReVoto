import { act, fireEvent, screen, within } from '@testing-library/react';
import { useEffect } from 'react';
import { municipality, type ArchetypeProfile, type Territory } from '@/domain';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import { memoryDependencies, memoryTurnoutRepository } from '@/test/memoryRepositories';
import { renderWithApp } from '@/test/renderWithApp';
import { W09Archetype } from '../W09Archetype';
import { W09bBadge } from '../W09bBadge';
import { W09cMyMunicipalityAndMe } from '../W09cMyMunicipalityAndMe';
import type * as ExportCard from '@/presentation/share/exportCard';
import { shareBlocker, W12Share } from './W12Share';

const exporter = vi.hoisted(() => ({
  cardToPng: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  download: vi.fn(),
  shareOrDownload: vi.fn(async () => 'downloaded' as const),
}));
vi.mock('@/presentation/share/exportCard', async (original) => ({
  ...(await original<typeof ExportCard>()),
  ...exporter,
}));

const IZTACALCO = municipality(9, 6, 'Iztacalco', 'Ciudad de México') as Territory;
const A4: ArchetypeProfile = {
  archetype: 'A4',
  level: 2.38,
  presidentialEffect: 11.04,
  trend: 3.97,
  volatility: 1.13,
  typicality: 0.37,
  trait: 'presidential-effect',
};

/** Chooses Iztacalco, answers «Sobre ti» and mounts the page with the share sheet on top. */
function Harness({ Page }: { Page: () => React.JSX.Element }) {
  const nav = useNavigation();
  const { answer } = useProfile();
  useEffect(() => {
    nav.chooseTerritory(IZTACALCO);
    answer('age', '18–24');
    for (const k of ['voted2018', 'voted2021', 'voted2024'] as const) answer(k, 'Sí');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Page />
      {nav.sheet === 'W-12' && <W12Share />}
    </>
  );
}

const deps = () => ({
  ...memoryDependencies(),
  turnout: memoryTurnoutRepository({
    municipalityProfile: async () => ({ neighbours: ['9-2', '9-3'], archetype: A4 }),
  }),
});
const open = async (Page: () => React.JSX.Element, button: RegExp) => {
  await renderWithApp(<Harness Page={Page} />, deps());
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: button }));
  return screen.getByRole('dialog', { name: 'Comparte este dato' });
};
const chosen = (sheet: HTMLElement) =>
  within(within(sheet).getByRole('radiogroup', { name: 'Qué compartes' })).getByRole('radio', {
    checked: true,
  });

describe('W-12 · Share sheet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('«Compartir mi arquetipo» opens on the archetype, with the real municipality and figure', async () => {
    const sheet = await open(W09Archetype, /Compartir mi arquetipo/);
    expect(chosen(sheet)).toHaveTextContent('Mi arquetipo');
    const card = within(sheet).getByRole('figure', {
      name: /Arquetipo de Iztacalco, Ciudad de México: De elección grande/,
    });
    expect(card).toHaveTextContent('+11.0 pts');
    expect(card).toHaveTextContent('IZTACALCO ES…');
  });

  it('«Compartir mi insignia» opens on the badge, compared with the generation in the state', async () => {
    const sheet = await open(W09bBadge, /Compartir mi insignia/);
    expect(chosen(sheet)).toHaveTextContent('Mi insignia');
    const card = within(sheet).getByRole('figure');
    expect(card).toHaveTextContent('3 de 3');
    expect(card).toHaveTextContent('1.7 de 3');
  });

  it('«Compartir los dos» opens on both cards', async () => {
    const sheet = await open(W09cMyMunicipalityAndMe, /Compartir los dos/);
    expect(chosen(sheet)).toHaveTextContent('Los dos');
    expect(within(sheet).getByRole('figure')).toHaveAccessibleName(/SIN TEMPORADA/);
  });

  it('downloads the archetype, the badge and both as PNG files', async () => {
    const sheet = await open(W09Archetype, /Compartir mi arquetipo/);
    const names: string[] = [];
    for (const option of ['Mi arquetipo', 'Mi insignia', 'Los dos']) {
      fireEvent.click(within(sheet).getByRole('radio', { name: option }));
      fireEvent.click(within(sheet).getByRole('button', { name: 'Descargar imagen' }));
      await act(async () => {});
      names.push(exporter.download.mock.calls.at(-1)?.[1] as string);
    }
    expect(names).toEqual([
      'revoto-arquetipo-iztacalco-9x16.png',
      'revoto-insignia-iztacalco-9x16.png',
      'revoto-mi-municipio-y-yo-iztacalco-9x16.png',
    ]);
    expect(exporter.cardToPng).toHaveBeenCalledTimes(3);
    expect(within(sheet).getByRole('status')).toHaveTextContent('Imagen descargada');
  });

  it('without a municipality it asks to choose one instead of drawing placeholders', async () => {
    await renderWithApp(<W12Share />);
    const sheet = screen.getByRole('dialog', { name: 'Comparte este dato' });
    expect(within(sheet).queryByRole('figure')).toBeNull();
    expect(sheet).toHaveTextContent('Elige un municipio para crear la tarjeta de su arquetipo.');
    expect(within(sheet).getByRole('button', { name: 'Descargar imagen' })).toBeDisabled();
  });

  it('without a municipality the badge card asks for one instead of «—.— de 3» (DEF-26)', async () => {
    function NoTerritory() {
      const { answer } = useProfile();
      useEffect(() => {
        answer('age', '18–24');
        for (const k of ['voted2018', 'voted2021', 'voted2024'] as const) answer(k, 'Sí');
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return <W12Share />;
    }
    await renderWithApp(<NoTerritory />);
    await act(async () => {});
    const sheet = screen.getByRole('dialog', { name: 'Comparte este dato' });
    fireEvent.click(within(sheet).getByRole('radio', { name: 'Mi insignia' }));
    expect(within(sheet).queryByRole('figure')).toBeNull();
    expect(sheet).not.toHaveTextContent('—.— de 3');
    expect(sheet).toHaveTextContent('Elige un municipio para comparar tu insignia');
    expect(within(sheet).getByRole('button', { name: 'Elegir municipio' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Descargar imagen' })).toBeDisabled();
  });
});

describe('Share buttons without a municipality (DEF-26)', () => {
  function Answered({ Page }: { Page: () => React.JSX.Element }) {
    const { answer } = useProfile();
    useEffect(() => {
      answer('age', '25–34');
      for (const k of ['voted2018', 'voted2021', 'voted2024'] as const) answer(k, 'Sí');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <Page />;
  }

  it.each([
    ['W-09', W09Archetype, /Compartir mi arquetipo/],
    ['W-09b', W09bBadge, /Compartir mi insignia/],
    ['W-09c', W09cMyMunicipalityAndMe, /Compartir los dos/],
  ] as const)(
    '%s asks for a municipality instead of sharing a card with placeholders',
    async (_, Page, share) => {
      const { container } = await renderWithApp(<Answered Page={Page} />);
      await act(async () => {});
      expect(screen.queryByRole('button', { name: share })).toBeNull();
      expect(
        screen.getByRole('button', {
          name: /^(Elige tu municipio para compartir|Elegir municipio)$/,
        }),
      ).toBeInTheDocument();
      for (const f of container.querySelectorAll('figure')) {
        expect(f.textContent).not.toMatch(/\[|—\.—/);
      }
    },
  );
});

describe('W-09 without a municipality', () => {
  it('shows the «elige tu municipio» card instead of a sample archetype', async () => {
    await renderWithApp(<W09Archetype />);
    await act(async () => {});
    const card = screen.getByRole('figure');
    expect(card).toHaveTextContent('¿Cuál es el de tu municipio?');
    expect(card).not.toHaveTextContent('Siempre presente');
    expect(screen.queryByRole('radiogroup', { name: /Vista previa/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Elegir municipio' })).toBeInTheDocument();
  });
});

describe('W-09c without a municipality', () => {
  it('with answers: the card waits for the municipality and offers to choose it', async () => {
    function Answered() {
      const { answer } = useProfile();
      useEffect(() => {
        answer('age', '25–34');
        for (const k of ['voted2018', 'voted2021', 'voted2024'] as const) answer(k, 'Sí');
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return <W09cMyMunicipalityAndMe />;
    }
    await renderWithApp(<Answered />);
    await act(async () => {});
    expect(
      screen.getByText(/Tu insignia ya tiene su mitad. Elige tu municipio/),
    ).toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveTextContent('Falta tu municipio');
    expect(screen.getByRole('button', { name: /Tu municipio: elígelo/ })).toBeInTheDocument();
  });

  it('without answers: both halves wait and nothing is shared', async () => {
    await renderWithApp(<W09cMyMunicipalityAndMe />);
    await act(async () => {});
    expect(screen.getByRole('figure')).toHaveTextContent('Faltan las dos mitades de la tarjeta.');
    expect(screen.queryByRole('button', { name: /Compartir/ })).toBeNull();
  });
});

describe('shareBlocker', () => {
  const ready = { municipality: 'Iztacalco', archetype: true, badge: true, generation: 1.8 };

  it('lets every card through when all its figures exist', () => {
    for (const what of ['archetype', 'badge', 'both'] as const) {
      expect(shareBlocker(what, ready)).toBeNull();
    }
  });

  it('asks for a municipality before anything else', () => {
    for (const what of ['archetype', 'badge', 'both'] as const) {
      expect(shareBlocker(what, { ...ready, municipality: null })?.fix).toBe('territory');
    }
  });

  it('asks for the answers when the badge or the age is missing', () => {
    expect(shareBlocker('badge', { ...ready, badge: false })?.fix).toBe('answer');
    expect(shareBlocker('both', { ...ready, generation: null })?.text).toMatch(/Dinos tu edad/);
    expect(shareBlocker('archetype', { ...ready, badge: false, generation: null })).toBeNull();
  });
});
