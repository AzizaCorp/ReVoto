import type { QualityRepository } from '@/application';
import type { QualityReport } from '@/domain';
import type { CalidadDto } from '@revoto/contracts';
import { JsonClient } from './JsonClient';
import { toQualityReport } from './mappers';

/** Adapter of the QualityRepository port: manifest.json + <version>/calidad.json (W-20). */
export class JsonQualityRepository implements QualityRepository {
  constructor(private readonly client = new JsonClient()) {}

  async report(): Promise<QualityReport> {
    const [manifest, quality] = await Promise.all([
      this.client.currentVersion(),
      this.client.read<CalidadDto>('calidad.json'),
    ]);
    return toQualityReport(manifest, quality);
  }
}
