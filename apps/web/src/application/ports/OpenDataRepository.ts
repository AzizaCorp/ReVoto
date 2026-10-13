/** W-16 · Where the open data of the current version can be downloaded (US-22). */
export interface OpenDataLinks {
  readonly version: string;
  /** ISO date of the run. */
  readonly generatedAt: string;
  /** Turnout by election, territory, age and sex, with counts. */
  readonly turnoutCsv: string;
  /** National series (JSON of the L4 contract). */
  readonly nationalJson: string;
  /** Folder with one JSON per state and municipality. */
  readonly baseUrl: string;
}

export interface OpenDataRepository {
  links(): Promise<OpenDataLinks>;
}
