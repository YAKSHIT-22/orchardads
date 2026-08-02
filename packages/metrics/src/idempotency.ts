import { createHash } from 'node:crypto';

/**
 * Metric idempotency key (ARCHITECTURE.md sec 5.3). The metric_fact primary key
 * is this tuple, so re-syncing a window is a no-op ON CONFLICT DO UPDATE.
 */
export function breakdownHash(breakdown: Record<string, string> | null): string {
  if (!breakdown || Object.keys(breakdown).length === 0) return '';
  const canonical = Object.keys(breakdown)
    .sort()
    .map((k) => `${k}=${breakdown[k]}`)
    .join('&');
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

export function metricFactKey(p: {
  workspaceId: string;
  platform: string;
  entityId: string;
  grain: string;
  bucketAt: string;
  breakdownHash: string;
  schemaVersion: number;
}): string {
  return [
    p.workspaceId,
    p.platform,
    p.entityId,
    p.grain,
    p.bucketAt,
    p.breakdownHash,
    p.schemaVersion,
  ].join('|');
}
