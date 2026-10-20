import { fireEvent, render, screen } from '@testing-library/react';
import { Chip } from './Chip';

describe('Chip', () => {
  it('exposes its pressed state and responds to clicks', () => {
    const onClick = vi.fn();
    render(
      <Chip pressed onClick={onClick}>
        25–34
      </Chip>,
    );
    const chip = screen.getByRole('button', { name: '25–34' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('can act as a radio inside a radiogroup', () => {
    render(
      <Chip role="radio" pressed={false} onClick={() => {}}>
        18–24
      </Chip>,
    );
    expect(screen.getByRole('radio', { name: '18–24' })).toHaveAttribute('aria-checked', 'false');
  });
});
