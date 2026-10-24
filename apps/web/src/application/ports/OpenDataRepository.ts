/** The three open data tables of W-16 (US-22). */
export type OpenDataset = 'turnout' | 'ageSex' | 'archetypes';

/** Download URLs of one table; null when the file is not published. */
export interface DownloadLinks {
  readonly csv: string | null;
  readonly json: string | null;
}

/** W-16 · Where the open data of the current version can be downloaded (US-22). */
export interface OpenDataLinks {
  /** Null when the data folder was published without manifest.json. */
  readonly version: string | null;
  /** ISO date of the run. */
  readonly generatedAt: string | null;
  /** Flat tables (one row per territory and election) as CSV and JSON. */
  readonly downloads: Readonly<Record<OpenDataset, DownloadLinks>>;
  /** National series (JSON of the L4 contract). */
  readonly nationalJson: string;
}

export interface OpenDataRepository {
  links(): Promise<OpenDataLinks>;
}
