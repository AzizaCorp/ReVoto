/** RN-06: the only valid categories of the breakdown by sex (codes as published by INE). */
export const SEXES = ['H', 'M'] as const;
export type Sex = (typeof SEXES)[number];

/** Labels shown to people, so they stay in Spanish. */
export const SEX_LABEL: Record<Sex, string> = { H: 'Hombres', M: 'Mujeres' };
