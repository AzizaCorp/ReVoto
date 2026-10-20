import { render, screen } from '@testing-library/react';
import { Notice } from './Notice';

describe('Notice', () => {
  it('an error is announced as an alert', () => {
    render(<Notice tone="error">No pudimos cargar las cifras</Notice>);
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar las cifras');
  });

  it('the other tones are notes', () => {
    render(<Notice title="Datos pendientes">Las cifras aparecen como —.— %</Notice>);
    expect(screen.getByRole('note')).toHaveTextContent('Datos pendientes');
  });
});
