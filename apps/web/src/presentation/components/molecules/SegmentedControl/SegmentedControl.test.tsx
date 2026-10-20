import { fireEvent, render, screen } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('is a radiogroup that reports the chosen option', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Tipo de elección"
        options={[
          { value: 'p', text: 'Presidencial' },
          { value: 'i', text: 'Intermedia' },
        ]}
        value="p"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Presidencial' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Intermedia' }));
    expect(onChange).toHaveBeenCalledWith('i');
  });
});
