import type { QualityReport } from '@/domain';

/** Output port for the quality report of the current data version (W-20). */
export interface QualityRepository {
  report(): Promise<QualityReport>;
}
