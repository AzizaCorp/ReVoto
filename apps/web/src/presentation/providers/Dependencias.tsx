import { createContext, useContext, type ReactNode } from 'react';
import type { ParticipacionRepository } from '@/application';

/**
 * Inyección de dependencias para la presentación. Las páginas piden aquí el repositorio
 * y lo pasan a los casos de uso; nunca importan infrastructure directamente.
 */
export interface Dependencias {
  participacion: ParticipacionRepository;
}

const Contexto = createContext<Dependencias | null>(null);

export function ProveedorDependencias({
  valor,
  children,
}: {
  valor: Dependencias;
  children: ReactNode;
}) {
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useDependencias(): Dependencias {
  const d = useContext(Contexto);
  if (!d) throw new Error('useDependencias debe usarse dentro de <ProveedorDependencias>');
  return d;
}
