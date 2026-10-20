/**
 * Personal badges (W-02b → W-09b). They are assigned on the device from three answers about the
 * 2018 (presidential), 2021 (midterm) and 2024 (presidential) federal elections. Nothing is stored
 * or sent.
 */
export const BADGES = {
  I1: 'Debutante',
  I2: 'Fiel a la urna',
  I3: 'De elección grande',
  I4: 'En racha',
  I5: 'Espíritu libre',
  I6: 'Por estrenar',
} as const;

export type BadgeId = keyof typeof BADGES;
export const BADGE_IDS = Object.keys(BADGES) as BadgeId[];

/** Answer to «¿Votaste en …?». `unknown` («No recuerdo») is not counted as a vote. */
export type VoteAnswer = 'voted' | 'did-not-vote' | 'could-not' | 'unknown';

export interface VotingHistory {
  2018: VoteAnswer;
  2021: VoteAnswer;
  2024: VoteAnswer;
}

/** Elections in which the person says they voted (0 to 3). */
export function votesCount(h: VotingHistory): number {
  return [h[2018], h[2021], h[2024]].filter((a) => a === 'voted').length;
}

/**
 * Badge rules (design I0):
 * - I1 Debutante: could not vote before 2024 and voted in 2024.
 * - I2 Fiel a la urna: voted in 2018, 2021 and 2024.
 * - I3 De elección grande: voted in 2018 and 2024, not in 2021.
 * - I4 En racha: voted in 2024, but not in every previous one.
 * - I5 Espíritu libre: any other pattern with at least one vote (e.g. only 2021).
 * - I6 Por estrenar: no vote at all.
 */
export function assignBadge(h: VotingHistory): BadgeId {
  const v18 = h[2018] === 'voted';
  const v21 = h[2021] === 'voted';
  const v24 = h[2024] === 'voted';
  if (v18 && v21 && v24) return 'I2';
  if (v24 && h[2018] === 'could-not' && h[2021] === 'could-not') return 'I1';
  if (v18 && !v21 && v24) return 'I3';
  if (v24) return 'I4';
  if (v18 || v21) return 'I5';
  return 'I6';
}
