/** W-16 · Where the open data of the current version can be downloaded (US-22). */
export interface OpenDataLinks {
  /** Null when the data folder was published without manifest.json. */
  readonly version: string | null;
  /** ISO date of the run. */
  readonly generatedAt: string | null;
  /** Turnout by election, territory, age and sex, with counts; null when not published. */
  readonly turnoutCsv: string | null;
  /** National series (JSON of the L4 contract). */
  readonly nationalJson: string;
  /** Folder with one JSON per state and municipality. */
  readonly baseUrl: string;
}

export interface OpenDataRepository {
  links(): Promise<OpenDataLinks>;
}
