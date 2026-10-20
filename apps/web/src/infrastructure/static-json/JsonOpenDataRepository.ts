import type { OpenDataLinks, OpenDataRepository } from '@/application';
import { JsonClient } from './JsonClient';

/** Adapter of the OpenDataRepository port: URLs of the published data folder (US-22). */
export class JsonOpenDataRepository implements OpenDataRepository {
  constructor(private readonly client = new JsonClient()) {}

  async links(): Promise<OpenDataLinks> {
    const [m, csv] = await Promise.all([
      this.client.currentVersion(),
      this.client.exists('csv/participacion.csv'),
    ]);
    return {
      version: m?.version_datos ?? null,
      generatedAt: m?.generado ?? null,
      turnoutCsv: csv ? this.client.url('csv/participacion.csv') : null,
      nationalJson: this.client.url(m?.nacional ?? 'nacional.json'),
      baseUrl: this.client.url(''),
    };
  }
}
