import { fireEvent, render, screen } from '@testing-library/react';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('is a titled dialog, takes the focus and closes with Escape', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open title="¿De dónde sale esta cifra?" onClose={onClose}>
        contenido
      </BottomSheet>,
    );
    const sheet = screen.getByRole('dialog', { name: '¿De dónde sale esta cifra?' });
    expect(sheet).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('draws nothing when closed', () => {
    render(
      <BottomSheet open={false} title="Ajustes" onClose={() => {}}>
        x
      </BottomSheet>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
