import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createSequence } from '@/domain';
import { DependenciesProvider, type Dependencies } from '@/presentation/providers/Dependencies';
import { NavigationProvider } from '@/presentation/providers/Navigation';
import { ProfileProvider } from '@/presentation/providers/Profile';
import { StoryProvider } from '@/presentation/providers/Story';
import { memoryDependencies } from './memoryRepositories';

/** Renders with every presentation provider and lets the use cases answer. */
export async function renderWithApp(ui: ReactNode, deps: Dependencies = memoryDependencies()) {
  const result = render(
    <DependenciesProvider value={deps}>
      <ProfileProvider>
        <NavigationProvider sequence={createSequence()}>
          <StoryProvider>{ui}</StoryProvider>
        </NavigationProvider>
      </ProfileProvider>
    </DependenciesProvider>,
  );
  await act(async () => {});
  return result;
}
