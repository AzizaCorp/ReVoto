import { useEffect } from 'react';
import { VisuallyHidden } from '@/presentation/components';
import { useNavigationShortcuts } from '@/presentation/hooks/useNavigationShortcuts';
import { PAGES, SHEETS } from '@/presentation/pages';
import { NavigationProvider, useNavigation } from '@/presentation/providers/Navigation';
import { ProfileProvider } from '@/presentation/providers/Profile';
import { StoryProvider } from '@/presentation/providers/Story';

/** Mounts the current page, the open sheet and the live region with the progress (HU-14). */
function View() {
  const nav = useNavigation();
  const Page = PAGES[nav.currentView];
  const Sheet = nav.sheet ? SHEETS[nav.sheet] : null;

  useNavigationShortcuts({ enabled: !nav.sheet, next: nav.next, previous: nav.previous });

  // When the screen changes, focus moves to the title so the screen reader announces it.
  useEffect(() => {
    document.querySelector<HTMLElement>('#content h1')?.focus();
  }, [nav.currentView]);

  return (
    <main id="content" aria-label="ReVoto">
      <Page />
      <div aria-live="polite">
        {nav.progress && <VisuallyHidden>{nav.progress.text}</VisuallyHidden>}
      </div>
      {Sheet && <Sheet />}
    </main>
  );
}

/** Presentation root: session state providers and the sequence engine (US-09). */
export function App() {
  return (
    <ProfileProvider>
      <NavigationProvider>
        <StoryProvider>
          <View />
        </StoryProvider>
      </NavigationProvider>
    </ProfileProvider>
  );
}
