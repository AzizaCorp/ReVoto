import { render, screen } from '@testing-library/react';
import { ShareCard } from './ShareCard';

describe('ShareCard', () => {
  it('is an article whose title is a heading', () => {
    render(<ShareCard kicker="[Municipio] es…" title="[Arquetipo]" figure="+—.— pts" />);
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '[Arquetipo]' })).toBeInTheDocument();
  });
});
