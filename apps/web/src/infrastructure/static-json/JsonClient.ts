import { DataUnavailable } from '@/application';
import type { ManifiestoDto } from '@revoto/contracts';

type Fetch = typeof fetch;

/**
 * Reads the static JSON files published under /data (DIS §5.1):
 * 1. Requests manifest.json without cache once per visit to pin the data version.
 * 2. Requests each file inside /data/<version_datos>/, which is immutable and cached for a year.
 * Translates any failure into DataUnavailable, the error the application understands.
 */
export class JsonClient {
  private manifest?: Promise<ManifiestoDto>;
  private readonly cache = new Map<string, Promise<unknown>>();

  constructor(
    private readonly base = '/data',
    private readonly fetcher: Fetch = (...args) => fetch(...args),
  ) {}

  async read<T>(path: string): Promise<T> {
    const { version_datos } = await this.currentVersion();
    const url = `${this.base}/${version_datos}/${path}`;
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

  /** Manifest of the current data version (requested once per visit, without cache). */
  currentVersion(): Promise<ManifiestoDto> {
    this.manifest ??= this.fetchJson<ManifiestoDto>(`${this.base}/manifest.json`, {
      cache: 'no-cache',
    }).catch((error: unknown) => {
      this.manifest = undefined;
      throw error;
    });
    return this.manifest;
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(url, init);
    } catch {
      throw new DataUnavailable(url, 'network');
    }
    if (!response.ok) throw new DataUnavailable(url, 'not-found');
    try {
      return (await response.json()) as T;
    } catch {
      throw new DataUnavailable(url, 'invalid');
    }
  }
}
