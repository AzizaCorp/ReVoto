import { render, screen } from '@testing-library/react';
import { ARCHETYPE_IDS, BADGE_IDS } from '@/domain';
import { DuoCard } from './DuoCard';
import { ArchetypeCard, BadgeCard } from './IdentityCard';

describe('ArchetypeCard', () => {
  it.each(ARCHETYPE_IDS)('%s is a figure named by its archetype, with the art hidden', (id) => {
    const { container } = render(<ArchetypeCard archetype={id} />);
    expect(screen.getByRole('figure')).toHaveAccessibleName(/^Arquetipo: /);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('never draws placeholders: without a municipality it is a preview with no figure (DEF-26)', () => {
    const { container } = render(<ArchetypeCard archetype="A1" />);
    expect(container).toHaveTextContent('UN MUNICIPIO ES…');
    expect(container.textContent).not.toMatch(/\[|—\.—/);
  });

  it('with a municipality it names it and shows its figure', () => {
    render(<ArchetypeCard archetype="A1" place="Iztacalco, Ciudad de México" stat="+3.2 pts" />);
    expect(screen.getByRole('figure')).toHaveAccessibleName(/Arquetipo de Iztacalco/);
    expect(screen.getByText('+3.2 pts')).toBeInTheDocument();
  });

  it('the post format leaves out the phrase', () => {
    render(<ArchetypeCard archetype="A1" format="post" />);
    expect(screen.queryByText('Pase lo que pase, aquí se vota.')).not.toBeInTheDocument();
  });
});

describe('BadgeCard', () => {
  it.each(BADGE_IDS)('%s shows its name and the comparison', (id) => {
    render(<BadgeCard badge={id} you="2 de 3" />);
    expect(screen.getByRole('figure')).toHaveAccessibleName(/Tú: 2 de 3/);
    expect(screen.getByText('TÚ')).toBeInTheDocument();
  });

  it('without a generation it leaves the comparison out instead of «—.— de 3»', () => {
    const { container } = render(<BadgeCard badge="I1" you="2 de 3" />);
    expect(container.textContent).not.toMatch(/\[|—\.—/);
    expect(screen.queryByText(/TU GENERACIÓN/)).not.toBeInTheDocument();
  });
});

describe('BadgeCard without answers', () => {
  it('invites to answer «Sobre ti»', () => {
    render(<BadgeCard badge={null} />);
    expect(screen.getByRole('figure')).toHaveAccessibleName(/Aún no tienes insignia/);
    expect(screen.getByText('¿Cuál es la tuya?')).toBeInTheDocument();
  });
});

describe('DuoCard', () => {
  it.each(BADGE_IDS)('%s × A5 has its own headline', (badge) => {
    render(<DuoCard archetype="A5" badge={badge} />);
    expect(screen.getByRole('figure')).toHaveAccessibleName(/^Mi municipio y yo: /);
  });

  it('without a badge it keeps the municipality half and leaves the «yo» half waiting', () => {
    render(<DuoCard archetype="A1" badge={null} format="post" />);
    expect(screen.getByRole('figure')).toHaveAccessibleName(/Falta tu insignia/);
    expect(screen.getByText('Falta tu parte')).toBeInTheDocument();
    expect(screen.getByText('Siempre presente')).toBeInTheDocument();
  });
});

describe('DuoCard without a municipality', () => {
  it('previews the archetype half without placeholders (DEF-26)', () => {
    const { container } = render(<DuoCard archetype="A1" badge="I1" you="2 de 3" />);
    expect(container).toHaveTextContent('UN MUNICIPIO ES…');
    expect(container.textContent).not.toMatch(/\[|—\.—/);
  });
});

describe('DuoCard halves', () => {
  it('with a badge and no municipality the municipality half asks for it', () => {
    const { container } = render(<DuoCard archetype={null} badge="I3" you="2 de 3" />);
    expect(screen.getByRole('figure')).toHaveAccessibleName(/Falta el arquetipo de mi municipio/);
    expect(container).toHaveTextContent('Falta tu municipio');
    expect(container).toHaveTextContent('Yo ya tengo mi insignia; falta mi municipio.');
  });

  it('without municipality nor answers both halves wait', () => {
    const { container } = render(<DuoCard archetype={null} badge={null} />);
    expect(container).toHaveTextContent('Faltan las dos mitades de la tarjeta.');
    expect(container).toHaveTextContent('Falta tu municipio');
    expect(container).toHaveTextContent('Falta tu parte');
    expect(container.textContent).not.toMatch(/\[|—\.—/);
  });
});

describe('BadgeCard without a generation', () => {
  it('shows what completes the comparison', () => {
    render(<BadgeCard badge="I3" you="2 de 3" generationHint="Elige tu municipio" />);
    expect(screen.getByText('TU GENERACIÓN')).toBeInTheDocument();
    expect(screen.getByText('Elige tu municipio')).toBeInTheDocument();
    expect(screen.queryByText(/Comparación: INE/)).not.toBeInTheDocument();
  });
});
