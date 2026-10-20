import { fireEvent, render, screen } from '@testing-library/react';
import { StatusView } from './StatusView';

describe('StatusView', () => {
  it('error: announces the reason and allows a retry (US-09 CA-05)', () => {
    const onRetry = vi.fn();
    render(<StatusView status="error" territory="Jalisco" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar las cifras de Jalisco.');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('threshold: explains why the state is shown (RN-05)', () => {
    render(<StatusView status="threshold" />);
    expect(screen.getByRole('note')).toHaveTextContent('muy pocos registros');
  });
});
