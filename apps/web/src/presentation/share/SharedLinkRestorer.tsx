import { useEffect, useRef } from 'react';
import { listMunicipalities, listStates } from '@/application';
import { useDependencies } from '@/presentation/providers/Dependencies';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile, type QuestionKey } from '@/presentation/providers/Profile';
import { findTerritory, hasSharedState, parseSharedLocation, type SharedLink } from './sharedLink';

/**
 * US-24 · Opens a shared link as the person who shared it saw it: chooses its territory and, when
 * the link carries them, fills «Sobre ti» with their answers. The address is read on the first
 * render, before the navigation cleans it, and again when a link is pasted into an open tab of the
 * same screen (only its fragment changes, so the page does not reload).
 */
export function SharedLinkRestorer() {
  const nav = useNavigation();
  const { answer } = useProfile();
  const { turnout } = useDependencies();
  const first = useRef<SharedLink | null>(null);
  first.current ??= parseSharedLocation(window.location);

  // The latest callbacks, for the listener registered once below.
  const deps = useRef({ choose: nav.chooseTerritory, answer, turnout });
  deps.current = { choose: nav.chooseTerritory, answer, turnout };

  useEffect(() => {
    let live = true;
    const restore = (link: SharedLink) => {
      if (!hasSharedState(link)) return;
      const { choose, answer: set, turnout: repo } = deps.current;
      for (const [key, value] of Object.entries(link.answers ?? {})) {
        if (value) set(key as QuestionKey, value);
      }
      const target = link.territory;
      if (!target) return;
      void (async () => {
        const states = await listStates(repo);
        const towns =
          target.municipalityCode === undefined
            ? []
            : await listMunicipalities(repo, target.stateCode);
        const territory = findTerritory(target, states, towns);
        if (live && territory) choose(territory);
      })().catch(() => {
        // A link to a territory that no longer exists opens with the national figures.
      });
    };
    if (first.current) restore(first.current);
    const onHash = () => {
      const link = parseSharedLocation(window.location);
      if (!hasSharedState(link)) return;
      restore(link);
      // An old `#/W-04?…` link moves the view, and the navigation rewrites the address itself.
      if (!window.location.hash.startsWith('#/')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => {
      live = false;
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  return null;
}
