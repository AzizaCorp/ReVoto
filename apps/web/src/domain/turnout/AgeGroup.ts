/** RN-04: the only age groups that can be published. Single ages are never shown. */
export const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-59', '60+'] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

const BOUNDS: Record<AgeGroup, readonly [number, number]> = {
  '18-24': [18, 24],
  '25-34': [25, 34],
  '35-44': [35, 44],
  '45-59': [45, 59],
  '60+': [60, 110],
};

/** RN-09: outside 18–110 there is no group (the record is anomalous). */
export function ageGroupOf(age: number): AgeGroup | null {
  return AGE_GROUPS.find((g) => age >= BOUNDS[g][0] && age <= BOUNDS[g][1]) ?? null;
}
