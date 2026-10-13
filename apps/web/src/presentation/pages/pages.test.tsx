import { render, screen } from '@testing-library/react';
import { crearSecuencia } from '@/domain';
import {
  ProveedorNavegacion,
  type IdHoja,
  type IdVista,
} from '@/presentation/providers/Navegacion';
import { ProveedorPerfil } from '@/presentation/providers/Perfil';
import { HOJAS, PAGINAS } from '.';

const conProveedores = (ui: React.ReactNode) =>
  render(
    <ProveedorPerfil>
      <ProveedorNavegacion secuencia={crearSecuencia()}>{ui}</ProveedorNavegacion>
    </ProveedorPerfil>,
  );

describe('Páginas del esqueleto', () => {
  it.each(Object.entries(PAGINAS) as [IdVista, () => React.JSX.Element][])(
    '%s tiene un único título de nivel 1',
    (_, Pagina) => {
      conProveedores(<Pagina />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
  );

  it.each(Object.entries(HOJAS) as [IdHoja, () => React.JSX.Element][])(
    'la hoja %s es un diálogo con nombre',
    (_, Hoja) => {
      conProveedores(<Hoja />);
      expect(screen.getByRole('dialog')).toHaveAccessibleName();
    },
  );
});
