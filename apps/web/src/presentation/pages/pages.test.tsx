import { screen } from '@testing-library/react';
import { type SheetId, type ViewId } from '@/presentation/providers/Navigation';
import { renderWithApp } from '@/test/renderWithApp';
import { PAGES, SHEETS } from '.';

const withProviders = (ui: React.ReactNode) => renderWithApp(ui);

describe('Skeleton pages', () => {
  it.each(Object.entries(PAGES) as [ViewId, () => React.JSX.Element][])(
    '%s has a single level-1 heading',
    async (_, Page) => {
      await withProviders(<Page />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
  );

  it.each(Object.entries(SHEETS) as [SheetId, () => React.JSX.Element][])(
    'sheet %s is a named dialog',
    async (_, Sheet) => {
      await withProviders(<Sheet />);
      expect(screen.getByRole('dialog')).toHaveAccessibleName();
    },
  );

  it.each(['W-01', 'W-02', 'W-02b'] as ViewId[])(
    '%s has no «Fuente» or «Compartir» (they start at W-03)',
    async (id) => {
      const Page = PAGES[id];
      await withProviders(<Page />);
      expect(screen.queryByRole('button', { name: /fuente/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /compartir/i })).toBeNull();
    },
  );

  it('W-02 offers a way back to the cover', async () => {
    const Page = PAGES['W-02'];
    await withProviders(<Page />);
    expect(screen.getByRole('button', { name: /inicio/i })).toBeInTheDocument();
  });
});
