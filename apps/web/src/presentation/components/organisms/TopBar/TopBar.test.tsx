import { fireEvent, render, screen } from '@testing-library/react';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the logo, the progress and the settings button', () => {
    const onSettings = vi.fn();
    render(
      <TopBar
        progress={{ position: 3, total: 10, text: 'Pantalla 3 de 10' }}
        stepName="México votó"
        onSettings={onSettings}
      />,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'ReVoto' })).toBeInTheDocument();
    expect(screen.getByText('Pantalla 3 de 10')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes de lectura' }));
    expect(onSettings).toHaveBeenCalledOnce();
  });

  it('without progress does not draw the bar', () => {
    render(<TopBar onSettings={() => {}} />);
    expect(screen.queryByText(/Pantalla/)).not.toBeInTheDocument();
  });
});
