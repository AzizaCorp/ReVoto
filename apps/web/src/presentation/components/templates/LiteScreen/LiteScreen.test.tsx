import { fireEvent, render, screen } from '@testing-library/react';
import { LiteScreen } from './LiteScreen';

describe('LiteScreen', () => {
  it('lets you go back to the full version', () => {
    const onFullVersion = vi.fn();
    render(<LiteScreen onFullVersion={onFullVersion}>texto</LiteScreen>);
    fireEvent.click(screen.getByRole('button', { name: 'Versión completa' }));
    expect(onFullVersion).toHaveBeenCalledOnce();
  });

  it('shows «Fuente» only when there is a source to open', () => {
    const onSource = vi.fn();
    const { rerender } = render(<LiteScreen onFullVersion={() => {}}>texto</LiteScreen>);
    expect(screen.queryByRole('button', { name: 'Fuente' })).toBeNull();
    rerender(
      <LiteScreen onFullVersion={() => {}} onSource={onSource}>
        texto
      </LiteScreen>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fuente' }));
    expect(onSource).toHaveBeenCalledOnce();
  });
});
