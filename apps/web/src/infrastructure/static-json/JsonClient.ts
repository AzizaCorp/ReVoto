import { DataUnavailable } from '@/application';
import type { ManifiestoDto } from '@revoto/contracts';

type Fetch = typeof fetch;

const isAppShell = (response: Response) =>
  (response.headers.get('content-type') ?? '').includes('text/html');

/**
 * Reads the static JSON files of the L4 contract published under /data (packages/contracts).
 * /data holds the contents of one pipeline version folder, so every path is relative to it and
 * comes from the files themselves (catalog `archivo`, manifest paths), never built by hand.
 * Translates any failure into DataUnavailable, the error the application understands.
 */
export class JsonClient {
  private manifest?: Promise<ManifiestoDto | null>;
  private readonly cache = new Map<string, Promise<unknown>>();

  constructor(
    private readonly base = '/data',
    private readonly fetcher: Fetch = (...args) => fetch(...args),
  ) {}

  /** Public URL of a path inside the data folder. */
  url(path: string): string {
    return `${this.base}/${path}`;
  }

  read<T>(path: string): Promise<T> {
    const url = this.url(path);
    let promise = this.cache.get(url) as Promise<T> | undefined;
    if (!promise) {
      promise = this.fetchJson<T>(url).catch((error: unknown) => {
        this.cache.delete(url); // allows a retry (W-17)
        throw error;
      });
      this.cache.set(url, promise);
    }
    return promise;
  }

  /** Reads an optional file: null if it is not published (any other failure still throws). */
  async readOptional<T>(path: string): Promise<T | null> {
    try {
      return await this.read<T>(path);
    } catch (error) {
      if (error instanceof DataUnavailable && error.cause === 'not-found') return null;
      throw error;
    }
  }

  /** Whether a non-JSON file (e.g. the open-data CSV) is published. */
  async exists(path: string): Promise<boolean> {
    try {
      const response = await this.fetcher(this.url(path), { method: 'HEAD', cache: 'no-cache' });
      return response.ok && !isAppShell(response);
    } catch {
      return false;
    }
  }

  /** manifest.json of the published version, or null if the folder was published without it. */
  currentVersion(): Promise<ManifiestoDto | null> {
    this.manifest ??= this.readOptional<ManifiestoDto>('manifest.json').catch((error: unknown) => {
      this.manifest = undefined;
      throw error;
    });
    return this.manifest;
  }

  private async fetchJson<T>(url: string): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(url, { cache: 'no-cache' });
    } catch {
      throw new DataUnavailable(url, 'network');
    }
    // A missing file can come back as the app's index.html with 200: the Vite dev server and the
    // Vercel rewrite of «/(.*)» both fall back to the SPA. That is a missing file, not bad data.
    if (!response.ok || isAppShell(response)) throw new DataUnavailable(url, 'not-found');
    try {
      return (await response.json()) as T;
    } catch {
      throw new DataUnavailable(url, 'invalid');
    }
  }
}
