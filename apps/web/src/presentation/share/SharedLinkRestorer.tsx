import { useEffect, useState } from 'react';
import { listMunicipalities, listStates } from '@/application';
import { useDependencies } from '@/presentation/providers/Dependencies';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile, type QuestionKey } from '@/presentation/providers/Profile';
import { findTerritory, hasSharedState, parseSharedHash } from './sharedLink';

/**
 * US-24 · Opens a shared link as the person who shared it saw it: chooses its territory and, when
 * the link carries them, fills «Sobre ti» with their answers. The hash is read once, on the first
 * render, before the navigation cleans it from the address bar.
 */
export function SharedLinkRestorer() {
  const nav = useNavigation();
  const { answer } = useProfile();
  const { turnout } = useDependencies();
  const [link] = useState(() => parseSharedHash(window.location.hash));

  useEffect(() => {
    if (!hasSharedState(link)) return undefined;
    if (link.answers) {
      for (const [key, value] of Object.entries(link.answers)) {
        if (value) answer(key as QuestionKey, value);
      }
    }
    const target = link.territory;
    if (!target) return undefined;
    let live = true;
    void (async () => {
      const states = await listStates(turnout);
      const towns =
        target.municipalityCode === undefined
          ? []
          : await listMunicipalities(turnout, target.stateCode);
      const territory = findTerritory(target, states, towns);
      if (live && territory) nav.chooseTerritory(territory);
    })().catch(() => {
      // A link to a territory that no longer exists opens with the national figures.
    });
    return () => {
      live = false;
    };
    // Runs once, with the link of the first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link]);

  return null;
}
