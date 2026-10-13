import { fireEvent, render, screen } from '@testing-library/react';
import { Disclosure } from './Disclosure';

describe('Disclosure', () => {
  it('a button in the heading opens and closes the content', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <Disclosure title="Fuente" icon="info" open={false} onToggle={onToggle}>
        Conteos censales
      </Disclosure>,
    );
    const button = screen.getByRole('button', { name: 'Fuente' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Conteos censales')).not.toBeVisible();
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledOnce();
    rerender(
      <Disclosure title="Fuente" icon="info" open onToggle={onToggle}>
        Conteos censales
      </Disclosure>,
    );
    expect(screen.getByText('Conteos censales')).toBeVisible();
  });

  it('without onToggle it is a plain open section with its heading', () => {
    render(
      <Disclosure title="Validación" icon="check" open>
        Cada cifra se compara
      </Disclosure>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Validación' })).toBeInTheDocument();
  });
});
