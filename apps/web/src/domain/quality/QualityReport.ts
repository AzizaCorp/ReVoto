/** RF-20, RF-23 · Result of each check the pipeline ran on a data version (W-20). */
export type CheckResult = 'passed' | 'failed' | 'pending';

export interface QualityCheck {
  /** Rule it verifies, e.g. «RN-05» or «RF-23». */
  readonly id: string;
  readonly description: string;
  readonly result: CheckResult;
  readonly detail: string;
}

export interface QualityReport {
  /** Immutable data version (`AAAAMMDD-hash7`). */
  readonly version: string;
  /** ISO date of the run. */
  readonly generatedAt: string;
  readonly source: string;
  /** RF-23: largest difference against official INE figures, in points; null until compared. */
  readonly maxDifferencePoints: number | null;
  readonly checks: readonly QualityCheck[];
}

/** The version can be published only if no check failed. */
export function isPublishable(report: QualityReport): boolean {
  return report.checks.every((c) => c.result !== 'failed');
}
