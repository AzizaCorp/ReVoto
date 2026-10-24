import { fireEvent, screen } from '@testing-library/react';
import { renderWithApp } from '@/test/renderWithApp';
import { useNavigation } from '@/presentation/providers/Navigation';
import { W15Lite } from '../W15Lite';
import { W13Settings } from './W13Settings';

const root = document.documentElement;

describe('W-13 · Reading settings', () => {
  afterEach(() => {
    delete root.dataset.reading;
    delete root.dataset.textSize;
    delete root.dataset.motion;
    window.location.hash = '';
  });

  it('applies the text size to the whole page and keeps it when reopened (DEF-28)', async () => {
    const { unmount } = await renderWithApp(<W13Settings />);
    fireEvent.click(screen.getByRole('radio', { name: 'A+' }));
    expect(root.dataset.textSize).toBe('large');
    fireEvent.click(screen.getByRole('switch', { name: /Lectura fácil/ }));
    expect(root.dataset.reading).toBe('easy');
    unmount();

    await renderWithApp(<W13Settings />);
    expect(screen.getByRole('radio', { name: 'A+' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: /Lectura fácil/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    fireEvent.click(screen.getByRole('radio', { name: 'A' }));
    expect(root.dataset.textSize).toBeUndefined();
  });

  it('can be opened from the lite version, where «Versión ligera» is on (DEF-28)', async () => {
    window.location.hash = '#/W-15';
    function Lite() {
      const nav = useNavigation();
      return (
        <>
          <W15Lite />
          {nav.sheet === 'W-13' && <W13Settings />}
        </>
      );
    }
    await renderWithApp(<Lite />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }));
    expect(screen.getByRole('switch', { name: /Versión ligera/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
