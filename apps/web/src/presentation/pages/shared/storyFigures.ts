// Figures of the story derived from the chosen territory (TerritoryStory) for the pages.
import { placeInState, type PlaceInState, type TerritoryStory } from '@/application';
import {
  archetypeFigure,
  NATIONAL,
  turnoutIn,
  type AgeGroup,
  type ArchetypeProfile,
  type ElectionTurnout,
  type Territory,
} from '@/domain';
import { points, pointsAbs } from '@/presentation/format';

/** Election the story talks about by default (the most recent one). */
export const YEAR = 2024 as const;

export interface Breakdown {
  readonly figures: ElectionTurnout | null;
  readonly territory: Territory;
  /** The municipality has no breakdown yet: the figures are its state's. */
  readonly fromState: boolean;
}

/**
 * Figures by age or sex for the chosen scope. The breakdown is published by state and for the
 * country; a municipality shows its state's until the pipeline computes it from the section.
 */
export function breakdown(
  story: TerritoryStory,
  kind: 'age' | 'sex',
  scope: 'territory' | 'national',
): Breakdown {
  if (scope === 'national') {
    return {
      figures: turnoutIn(story.national.elections, YEAR),
      territory: NATIONAL,
      fromState: false,
    };
  }
  const own = turnoutIn(story.own.elections, YEAR);
  const has = (e: ElectionTurnout | null) =>
    e !== null && Object.keys(kind === 'age' ? e.byAge : e.bySex).length > 0;
  if (has(own)) return { figures: own, territory: story.own.territory, fromState: false };
  if (story.state) {
    return {
      figures: turnoutIn(story.state.elections, YEAR),
      territory: story.state.territory,
      fromState: true,
    };
  }
  return {
    figures: turnoutIn(story.national.elections, YEAR),
    territory: NATIONAL,
    fromState: false,
  };
}

/** «18–24» (answer of W-02b) → «18-24» (RN-04 group). «Prefiero no decir» → null. */
export function ageGroupOfAnswer(answer: string | null): AgeGroup | null {
  const g = answer?.replace('–', '-').replace(' +', '+');
  return g === '18-24' || g === '25-34' || g === '35-44' || g === '45-59' || g === '60+' ? g : null;
}

/** W-08 · Place of the chosen municipality, or null for a state or the country. */
export function placeOf(story: TerritoryStory): PlaceInState | null {
  const t = story.territory;
  return t.level === 'municipality' && story.overview
    ? placeInState(story.overview, t.municipalityCode, YEAR)
    : null;
}

/** «+11.0 pts» or «1.1 pts» (volatility has no sign). */
export function archetypeStat(p: ArchetypeProfile): string {
  const f = archetypeFigure(p);
  return f.signed ? points(f.value) : pointsAbs(f.value);
}

/** W-09 · «¿Por qué?»: the dominant trait in one plain sentence. */
export function traitSentence(p: ArchetypeProfile): string {
  switch (p.trait) {
    case 'level':
      return `Vota ${pointsAbs(p.level)} ${p.level >= 0 ? 'más' : 'menos'} que el país, elección tras elección.`;
    case 'presidential-effect':
      return `En presidenciales sube ${pointsAbs(p.presidentialEffect)} ${p.presidentialEffect >= 0 ? 'más' : 'menos'} que el país.`;
    case 'trend':
      return `${p.trend >= 0 ? 'Gana' : 'Pierde'} ${pointsAbs(p.trend)} por década frente al país.`;
    case 'volatility':
      return `Su participación varía ${pointsAbs(p.volatility)} de una elección a otra, más allá de su tendencia.`;
  }
}
