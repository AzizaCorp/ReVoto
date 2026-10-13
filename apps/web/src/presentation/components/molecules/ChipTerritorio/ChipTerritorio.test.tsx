import { fireEvent, render, screen } from '@testing-library/react';
import { ChipTerritorio } from './ChipTerritorio';

describe('ChipTerritorio', () => {
  it('anuncia el territorio y abre el selector', () => {
    const onClick = vi.fn();
    render(<ChipTerritorio territorio="Jalisco · Guadalajara" onClick={onClick} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Cambiar territorio: Jalisco · Guadalajara' }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });
});
