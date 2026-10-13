import { fireEvent, render, screen } from '@testing-library/react';
import { LiteScreen } from './LiteScreen';

describe('LiteScreen', () => {
  it('lets you go back to the full version', () => {
    const onFullVersion = vi.fn();
    render(<LiteScreen onFullVersion={onFullVersion}>texto</LiteScreen>);
    fireEvent.click(screen.getByRole('button', { name: 'Versión completa' }));
    expect(onFullVersion).toHaveBeenCalledOnce();
  });
});
