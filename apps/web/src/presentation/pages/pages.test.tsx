import { render, screen } from '@testing-library/react';
import { createSequence } from '@/domain';
import { NavigationProvider, type SheetId, type ViewId } from '@/presentation/providers/Navigation';
import { ProfileProvider } from '@/presentation/providers/Profile';
import { PAGES, SHEETS } from '.';

const withProviders = (ui: React.ReactNode) =>
  render(
    <ProfileProvider>
      <NavigationProvider sequence={createSequence()}>{ui}</NavigationProvider>
    </ProfileProvider>,
  );

describe('Skeleton pages', () => {
  it.each(Object.entries(PAGES) as [ViewId, () => React.JSX.Element][])(
    '%s has a single level-1 heading',
    (_, Page) => {
      withProviders(<Page />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
  );

  it.each(Object.entries(SHEETS) as [SheetId, () => React.JSX.Element][])(
    'sheet %s is a named dialog',
    (_, Sheet) => {
      withProviders(<Sheet />);
      expect(screen.getByRole('dialog')).toHaveAccessibleName();
    },
  );

  it.each(['W-01', 'W-02', 'W-02b'] as ViewId[])(
    '%s has no «Fuente» or «Compartir» (they start at W-03)',
    (id) => {
      const Page = PAGES[id];
      withProviders(<Page />);
      expect(screen.queryByRole('button', { name: /fuente/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /compartir/i })).toBeNull();
    },
  );

  it('W-02 offers a way back to the cover', () => {
    const Page = PAGES['W-02'];
    withProviders(<Page />);
    expect(screen.getByRole('button', { name: /inicio/i })).toBeInTheDocument();
  });
});
