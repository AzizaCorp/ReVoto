import type { ShareSubject } from '@/presentation/providers/Navigation';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import { compareWithGeneration } from './storyFigures';

export interface ShareBlocker {
  readonly text: string;
  /** What the person can do to unblock the card, if anything. */
  readonly fix: 'answer' | 'territory' | null;
}

/**
 * Why a card cannot be drawn yet, or null when every figure it shows exists. A card is never drawn
 * with placeholders (DEF-26): without a municipality there is no archetype and no generation to
 * compare with, so the sheet asks for what is missing instead.
 */
export function shareBlocker(
  what: ShareSubject,
  s: {
    /** Name of the chosen municipality, or null when none is chosen. */
    municipality: string | null;
    archetype: boolean;
    badge: boolean;
    /** Expected votes of the generation; null without a municipality or an age. */
    generation: number | null;
  },
): ShareBlocker | null {
  // A screen card (US-24) checks its own figures in slideCards.ts.
  if (what === 'slide') return null;
  const needsArchetype = what !== 'badge';
  const needsBadge = what !== 'archetype';
  if (!s.municipality) {
    return {
      text:
        what === 'archetype'
          ? 'Elige un municipio para crear la tarjeta de su arquetipo.'
          : what === 'badge'
            ? 'Elige un municipio para comparar tu insignia con tu generación.'
            : 'Elige un municipio para crear la tarjeta «Mi municipio y yo».',
      fix: 'territory',
    };
  }
  if (needsArchetype && !s.archetype) {
    return {
      text: `${s.municipality} tiene menos de 5 elecciones: aún no tiene arquetipo.`,
      fix: null,
    };
  }
  if (needsBadge && !s.badge) {
    return { text: 'Responde «Sobre ti» para crear tu insignia.', fix: 'answer' };
  }
  if (needsBadge && s.generation === null) {
    return {
      text: 'Dinos tu edad en «Sobre ti» para comparar tu insignia con tu generación.',
      fix: 'answer',
    };
  }
  return null;
}

/** shareBlocker with the state of the story: the chosen territory, the profile and the answers. */
export function useShareBlocker(what: ShareSubject): ShareBlocker | null {
  const nav = useNavigation();
  const story = useStoryData();
  const { badge, votes, answers } = useProfile();
  const t = nav.selected;
  return shareBlocker(what, {
    municipality: t.level === 'municipality' ? t.name : null,
    archetype: Boolean(story?.profile?.archetype),
    badge: Boolean(badge),
    generation: compareWithGeneration(story, votes, answers.age).expected,
  });
}
