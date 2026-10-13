import { fireEvent, render, screen } from '@testing-library/react';
import { BottomBar } from './BottomBar';

describe('BottomBar', () => {
  it('moves forward and opens the source', () => {
    const onNext = vi.fn();
    const onSource = vi.fn();
    render(<BottomBar onSource={onSource} onPrevious={null} onNext={onNext} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pantalla siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fuente' }));
    expect(onNext).toHaveBeenCalledOnce();
    expect(onSource).toHaveBeenCalledOnce();
  });

  it('has no «previous» on the first step and shows «Fin» on the last one', () => {
    render(<BottomBar onPrevious={null} onNext={null} />);
    expect(screen.queryByRole('button', { name: 'Pantalla anterior' })).not.toBeInTheDocument();
    expect(screen.getByText('Fin')).toBeInTheDocument();
  });

  it('without navigation it draws neither ‹ › nor «Fin» (cover)', () => {
    render(<BottomBar onSource={() => {}} onPrevious={null} onNext={() => {}} hideNavigation />);
    expect(screen.queryByRole('button', { name: 'Pantalla siguiente' })).not.toBeInTheDocument();
    expect(screen.queryByText('Fin')).not.toBeInTheDocument();
  });
});
