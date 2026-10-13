import { createContext, useContext, type ReactNode } from 'react';
import type { QualityRepository, TurnoutRepository } from '@/application';

/**
 * Dependency injection for the presentation. Pages ask for the repository here and pass it to
 * the use cases; they never import infrastructure directly.
 */
export interface Dependencies {
  turnout: TurnoutRepository;
  quality: QualityRepository;
}

const Context = createContext<Dependencies | null>(null);

export function DependenciesProvider({
  value,
  children,
}: {
  value: Dependencies;
  children: ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDependencies(): Dependencies {
  const d = useContext(Context);
  if (!d) throw new Error('useDependencies must be used inside <DependenciesProvider>');
  return d;
}
