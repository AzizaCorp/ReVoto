import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('monta la región principal sin errores', () => {
    render(<App />);
    expect(screen.getByRole('main', { name: 'ReVoto' })).toBeInTheDocument();
  });
});
