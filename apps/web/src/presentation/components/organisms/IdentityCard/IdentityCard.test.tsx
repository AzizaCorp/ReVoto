import { render, screen } from '@testing-library/react';
import { ARCHETYPE_IDS, BADGE_IDS } from '@/domain';
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
