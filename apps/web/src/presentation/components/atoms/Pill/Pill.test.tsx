import { render, screen } from '@testing-library/react';
import { Pill } from './Pill';

describe('Pill', () => {
  it('shows the number and the text', () => {
    render(<Pill number="2/9">México</Pill>);
    expect(screen.getByText('2/9')).toBeInTheDocument();
    expect(screen.getByText('México')).toBeInTheDocument();
  });
});
