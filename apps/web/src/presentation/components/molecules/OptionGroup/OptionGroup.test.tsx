import { fireEvent, render, screen } from '@testing-library/react';
import { OptionGroup } from './OptionGroup';

describe('OptionGroup', () => {
  it('marks the chosen option with aria-pressed', () => {
    const onSelect = vi.fn();
    render(
      <OptionGroup
        question="¿Votaste en 2024?"
        options={['Sí', 'No']}
        selected="Sí"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('group', { name: '¿Votaste en 2024?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sí' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onSelect).toHaveBeenCalledWith('No');
  });
});
