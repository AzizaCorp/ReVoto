import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('is a button with its accessible name and responds to clicks', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Siguiente</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as a link when it has href', () => {
    render(<Button href="#/W-10">Ver resumen</Button>);
    expect(screen.getByRole('link', { name: 'Ver resumen' })).toHaveAttribute('href', '#/W-10');
  });
});

describe('Button icons', () => {
  it('draws SVG icons that are hidden from assistive technology', () => {
    const { container } = render(
      <Button icon="info" trailingIcon="arrow">
        Fuente
      </Button>,
    );
    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(2);
    icons.forEach((i) => expect(i).toHaveAttribute('aria-hidden', 'true'));
    expect(screen.getByRole('button', { name: 'Fuente' })).toBeInTheDocument();
  });
});
