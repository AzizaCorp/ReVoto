import { render, screen } from '@testing-library/react';
import { ARCHETYPE_IDS, BADGE_IDS } from '@/domain';
import { DuoCard } from './DuoCard';
import { ArchetypeCard, BadgeCard } from './IdentityCard';

describe('ArchetypeCard', () => {
  it.each(ARCHETYPE_IDS)('%s is a figure named by its archetype, with the art hidden', (id) => {
    const { container } = render(<ArchetypeCard archetype={id} />);
    expect(screen.getByRole('figure')).toHaveAccessibleName(
      /Arquetipo de \[Municipio\], \[Entidad\]/,
    );
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
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
