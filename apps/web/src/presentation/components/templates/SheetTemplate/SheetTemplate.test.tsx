import { render, screen } from '@testing-library/react';
import { SheetTemplate } from './SheetTemplate';

describe('SheetTemplate', () => {
  it('draws the sheet with its actions', () => {
    render(
      <SheetTemplate
        open
        title="Comparte este dato"
        onClose={() => {}}
        actions={<button>Compartir…</button>}
      >
        vista previa
      </SheetTemplate>,
    );
    expect(screen.getByRole('dialog', { name: 'Comparte este dato' })).toHaveTextContent(
      'vista previa',
    );
    expect(screen.getByRole('button', { name: 'Compartir…' })).toBeInTheDocument();
  });
});
