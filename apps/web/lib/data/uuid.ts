import { createHash } from 'node:crypto';

/**
 * Deterministic UUID from stable parts. Used for PROXY_ONLY platforms (Pinterest)
 * whose entities are NOT persisted: metric_fact still needs a stable entity_id, so
 * we derive one from the external id instead of storing the entity. The value is a
 * valid 8-4-4-4-12 hex string that Postgres accepts as ::uuid.
 */
export function deterministicUuid(...parts: string[]): string {
  const h = createHash('sha1').update(parts.join('|')).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
