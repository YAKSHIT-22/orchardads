import type { EntityType, Platform, RetentionPolicy } from '@adsos/core';

/**
 * Retention is enforced in code, not documented (ARCHITECTURE.md sec 5.4).
 * TikTok permits persisting synced entities and analytics. The PROXY_ONLY /
 * ANALYTICS_ONLY policies remain available for any future storage-restricted
 * platform (e.g. Pinterest, if re-added).
 */
export function retentionFor(_platform: Platform, _entity: EntityType): RetentionPolicy {
  return 'PERSIST';
}

/** The repository layer refuses to persist rawSnapshot/derived text for non-PERSIST. */
export function mayPersistSnapshot(policy: RetentionPolicy): boolean {
  return policy === 'PERSIST';
}
