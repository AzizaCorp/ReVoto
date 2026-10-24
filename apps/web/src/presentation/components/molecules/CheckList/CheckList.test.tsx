import { render, screen } from '@testing-library/react';
import { CheckList } from './CheckList';

describe('CheckList', () => {
  it('lists every check with its status in words and no requirement codes', () => {
    render(
      <CheckList
        items={[
          { text: 'Comparación con cifras oficiales', passed: null },
          { text: 'Esquema y tipos homologados', passed: true },
        ]}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText(/RF-/)).not.toBeInTheDocument();
    expect(screen.getByText(/Pendiente/)).toBeInTheDocument();
    expect(screen.getByText(/Cumple/)).toBeInTheDocument();
  });
});
