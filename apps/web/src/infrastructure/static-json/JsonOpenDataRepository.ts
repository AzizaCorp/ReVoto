import type { DownloadLinks, OpenDataLinks, OpenDataRepository, OpenDataset } from '@/application';
import { DOWNLOADS, DOWNLOADS_DIR } from '../open-data/buildOpenData';
import { JsonClient } from './JsonClient';

/** W-16 · Links to the downloads built from the current copy (`data/descargas/`, vite plugin). */
export class JsonOpenDataRepository implements OpenDataRepository {
  constructor(private readonly client = new JsonClient()) {}

  private async file(name: string): Promise<string | null> {
    const path = `${DOWNLOADS_DIR}/${name}`;
    return (await this.client.exists(path)) ? this.client.url(path) : null;
  }

  async links(): Promise<OpenDataLinks> {
    const keys = Object.keys(DOWNLOADS) as OpenDataset[];
    const [m, ...files] = await Promise.all([
      this.client.currentVersion(),
      ...keys.map(async (k): Promise<DownloadLinks> => {
        const [csv, json] = await Promise.all([
          this.file(`${DOWNLOADS[k]}.csv`),
          this.file(`${DOWNLOADS[k]}.json`),
        ]);
        return { csv, json };
      }),
    ]);
    return {
      version: m?.version_datos ?? null,
      generatedAt: m?.generado ?? null,
      downloads: Object.fromEntries(keys.map((k, i) => [k, files[i]!])) as Record<
        OpenDataset,
        DownloadLinks
      >,
      nationalJson: this.client.url(m?.nacional ?? 'nacional.json'),
    };
  }
}
