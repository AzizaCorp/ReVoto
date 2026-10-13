import type { OpenDataLinks, OpenDataRepository } from '@/application';
import { JsonClient } from './JsonClient';

/** Adapter of the OpenDataRepository port: URLs inside the current data version. */
export class JsonOpenDataRepository implements OpenDataRepository {
  constructor(
    private readonly client = new JsonClient(),
    private readonly base = '/data',
  ) {}

  async links(): Promise<OpenDataLinks> {
    const m = await this.client.currentVersion();
    const root = `${this.base}/${m.version_datos}`;
    return {
      version: m.version_datos,
      generatedAt: m.generado,
      turnoutCsv: `${root}/csv/participacion.csv`,
      nationalJson: `${root}/nacional.json`,
      baseUrl: `${root}/`,
    };
  }
}
