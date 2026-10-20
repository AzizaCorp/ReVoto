import { createContext, useContext, type ReactNode } from 'react';
import { getTerritoryStory, type TerritoryStory } from '@/application';
import { type AsyncState, useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from './Dependencies';
import { useNavigation } from './Navigation';

type Story = AsyncState<TerritoryStory> & { retry: () => void };

const Context = createContext<Story | null>(null);

/**
 * Reads the data of the chosen territory once (getTerritoryStory) and shares it with every
 * screen of the story, so moving between screens does not load it again.
 */
export function StoryProvider({ children }: { children: ReactNode }) {
  const { turnout } = useDependencies();
  const { selected } = useNavigation();
  const story = useAsync(() => getTerritoryStory(turnout, selected), [turnout, selected]);
  return <Context.Provider value={story}>{children}</Context.Provider>;
}

export function useStory(): Story {
  const s = useContext(Context);
  if (!s) throw new Error('useStory must be used inside <StoryProvider>');
  return s;
}

/** The story once loaded, or null while it loads or after a failure. */
export function useStoryData(): TerritoryStory | null {
  const s = useStory();
  return s.status === 'ready' ? s.data : null;
}
