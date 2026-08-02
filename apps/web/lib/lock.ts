import 'server-only';
import { randomUUID } from 'node:crypto';
import { redis, redisConfigured } from './redis';

/**
 * Redis mutex. Reddit ROTATES refresh tokens - two concurrent refreshes for one
 * connection permanently break it (ARCHITECTURE.md sec 10.2). Serialize refreshes
 * (and entity writes) through this. Without Redis it is a best-effort no-op, which
 * is acceptable for single-process local dev.
 */
export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  opts: { ttlMs?: number; waitMs?: number } = {},
): Promise<T> {
  const ttlMs = opts.ttlMs ?? 10_000;
  const waitMs = opts.waitMs ?? 5_000;
  if (!redisConfigured) return fn();

  const token = randomUUID();
  const lockKey = `lock:${key}`;
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if (await redis.setNxPx(lockKey, token, ttlMs)) {
      try {
        return await fn();
      } finally {
        // Best-effort release only if we still own it.
        const cur = await redis.get(lockKey);
        if (cur === token) await redis.del(lockKey);
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  // Could not acquire in time - run anyway rather than dropping the work.
  return fn();
}
