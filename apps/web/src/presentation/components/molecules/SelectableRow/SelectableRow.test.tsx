import { fireEvent, render, screen } from '@testing-library/react';
import { SelectableRow } from './SelectableRow';

describe('SelectableRow', () => {
  it('is a radio with its state', () => {
    const onSelect = vi.fn();
    render(
      <div role="radiogroup" aria-label="Entidad">
        <SelectableRow checked={false} onSelect={onSelect}>
          Jalisco
        </SelectableRow>
      </div>,
    );
    const row = screen.getByRole('radio', { name: 'Jalisco' });
    expect(row).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
