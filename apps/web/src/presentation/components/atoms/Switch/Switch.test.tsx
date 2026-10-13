import { fireEvent, render, screen } from '@testing-library/react';
import { Switch } from './Switch';

describe('Switch', () => {
  it('is a switch with state that toggles when pressed', () => {
    const onChange = vi.fn();
    render(
      <>
        <span id="t">Lectura fácil</span>
        <Switch labelledBy="t" checked={false} onChange={onChange} />
      </>,
    );
    const s = screen.getByRole('switch', { name: 'Lectura fácil' });
    expect(s).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(s);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
