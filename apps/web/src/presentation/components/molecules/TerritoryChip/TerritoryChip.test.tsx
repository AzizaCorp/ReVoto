import { fireEvent, render, screen } from '@testing-library/react';
import { TerritoryChip } from './TerritoryChip';

describe('TerritoryChip', () => {
  it('announces the territory and opens the selector', () => {
    const onClick = vi.fn();
    render(<TerritoryChip territory="Jalisco · Guadalajara" onClick={onClick} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Cambiar territorio: Jalisco · Guadalajara' }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });
});
