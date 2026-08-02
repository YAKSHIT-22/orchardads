import 'server-only';
import { redis, redisConfigured } from './redis';

/**
 * Fixed-window limiter backed by Redis. Fail-OPEN when no Redis (local dev), so a
 * missing cache never blocks work. Used to keep platform API bursts under policy
 * limits (ARCHITECTURE.md sec 6).
 */
export async function rateLimit(bucket: string, limit: number, windowSec: number): Promise<boolean> {
  if (!redisConfigured) return true;
  const key = `rl:${bucket}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec);
  return count <= limit;
}

/** Await a slot in the bucket (simple pacing for sync loops). */
export async function throttle(bucket: string, limit: number, windowSec: number): Promise<void> {
  let tries = 0;
  while (!(await rateLimit(bucket, limit, windowSec)) && tries < 50) {
    tries++;
    await new Promise((r) => setTimeout(r, 200));
  }
}
