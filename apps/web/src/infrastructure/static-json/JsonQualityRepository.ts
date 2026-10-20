import type { QualityRepository } from '@/application';
import type { QualityReport } from '@/domain';
import type { CalidadDto, SerieNacionalDto } from '@revoto/contracts';
import { JsonClient } from './JsonClient';
import { toQualityReport } from './mappers';

/** Adapter of the QualityRepository port: manifest.json + calidad.json, both optional (W-20). */
export class JsonQualityRepository implements QualityRepository {
  constructor(private readonly client = new JsonClient()) {}

  async report(): Promise<QualityReport> {
    const [manifest, quality, national] = await Promise.all([
      this.client.currentVersion(),
      this.client.readOptional<CalidadDto>('calidad.json'),
      this.client.read<SerieNacionalDto>('nacional.json'),
    ]);
    return toQualityReport(manifest, quality, national.fuente);
  }
}
