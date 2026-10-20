import { render, screen } from '@testing-library/react';
import { SwitchRow } from './SwitchRow';

describe('SwitchRow', () => {
  it('names the switch with its title', () => {
    render(<SwitchRow title="Versión ligera" checked onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Versión ligera' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
