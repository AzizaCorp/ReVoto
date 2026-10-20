import { render, screen } from '@testing-library/react';
import { Text } from './Text';

describe('Text', () => {
  it('h1 is a level-1 heading that can receive focus', () => {
    render(<Text variant="h1">Así vota México</Text>);
    const h = screen.getByRole('heading', { level: 1, name: 'Así vota México' });
    expect(h).toHaveAttribute('tabindex', '-1');
  });

  it('body is a paragraph', () => {
    render(<Text variant="body">Texto de apoyo</Text>);
    expect(screen.getByText('Texto de apoyo').tagName).toBe('P');
  });
});
