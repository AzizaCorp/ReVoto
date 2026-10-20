import type { QualityReport } from '@/domain';
import type { QualityRepository } from '../ports/QualityRepository';

/** W-20 · Quality and validation report of the data version the app is showing. */
export function getQualityReport(repo: QualityRepository): Promise<QualityReport> {
  return repo.report();
}
