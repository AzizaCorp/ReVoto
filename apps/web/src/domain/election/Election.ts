/** Federal election years covered by the product. */
export const ELECTION_YEARS = [2009, 2012, 2015, 2018, 2021, 2024] as const;

export type ElectionYear = (typeof ELECTION_YEARS)[number];

/** RN-03: midterm and presidential elections must be told apart in every comparison over time. */
export type ElectionType = 'presidential' | 'midterm';

export interface Election {
  readonly year: ElectionYear;
  readonly type: ElectionType;
}

export function isElectionYear(value: number): value is ElectionYear {
  return (ELECTION_YEARS as readonly number[]).includes(value);
}

/** Presidential elections happen every 6 years since 2012; the other federal ones are midterms. */
export function electionTypeOf(year: ElectionYear): ElectionType {
  return (year - 2012) % 6 === 0 ? 'presidential' : 'midterm';
}

export function election(year: number): Election {
  if (!isElectionYear(year))
    throw new RangeError(`${year} is not a federal election year in the MVP`);
  return { year, type: electionTypeOf(year) };
}
