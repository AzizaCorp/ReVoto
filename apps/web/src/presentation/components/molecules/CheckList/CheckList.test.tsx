import { render, screen } from '@testing-library/react';
import { CheckList } from './CheckList';

describe('CheckList', () => {
  it('lists every check with its requirement and its status in words', () => {
    render(
      <CheckList
        items={[
          { text: 'Comparación con cifras oficiales', reference: 'RF-23', passed: null },
          { text: 'Esquema y tipos homologados', reference: 'RF-20', passed: true },
        ]}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('RF-23')).toBeInTheDocument();
    expect(screen.getByText(/Pendiente/)).toBeInTheDocument();
    expect(screen.getByText(/Cumple/)).toBeInTheDocument();
  });
});
