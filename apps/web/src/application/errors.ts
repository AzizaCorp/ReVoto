/**
 * Error the presentation knows how to show (W-17: message with cause and a retry button, CU-02 E1).
 * Infrastructure adapters translate their failures into this error.
 */
export class DataUnavailable extends Error {
  constructor(
    public readonly resource: string,
    public readonly cause: 'network' | 'not-found' | 'invalid',
  ) {
    super(`Could not load the data for ${resource} (${cause})`);
    this.name = 'DataUnavailable';
  }
}
