import 'server-only';
import { Redis as UpstashRedis } from '@upstash/redis';
import IoRedis from 'ioredis';

/**
 * Dual-mode Redis so one codebase is optimal both locally and on Vercel:
 *   1. UPSTASH_REDIS_REST_URL + TOKEN present -> Upstash HTTP client (serverless-safe,
 *      no TCP connection leaks across invocations). Use this on Vercel.
 *   2. else REDIS_URL present -> ioredis over TCP (local dev, redis://localhost:6379).
 *   3. else -> safe no-op; callers fall back to the DB.
 *
 * Redis is a cache + coordination primitive (token-refresh lock, rate-limit
 * counters), never the source of truth (ARCHITECTURE.md sec 6, sec 10.2).
 */
type Backend = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec?: number): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  ttl(key: string): Promise<number>;
  setNxPx(key: string, value: string, ttlMs: number): Promise<boolean>;
};

const g = globalThis as unknown as { redisBackend?: Backend | null };

function build(): Backend | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const c = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return {
      get: (k) => c.get<string>(k).then((v) => (v == null ? null : String(v))),
      set: (k, v, ttl) => (ttl ? c.set(k, v, { ex: ttl }) : c.set(k, v)),
      del: (...keys) => c.del(...keys),
      incr: (k) => c.incr(k),
      expire: (k, s) => c.expire(k, s),
      ttl: (k) => c.ttl(k),
      setNxPx: (k, v, ttlMs) => c.set(k, v, { px: ttlMs, nx: true }).then((r) => r === 'OK'),
    };
  }
  const url = process.env.REDIS_URL?.trim();
  if (url) {
    const needsTls = url.startsWith('rediss://') || /upstash\.io/i.test(url);
    const r = new IoRedis(url, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: true,
      ...(needsTls ? { tls: { rejectUnauthorized: false } } : {}),
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
    });
    r.on('error', () => {});
    return {
      get: (k) => r.get(k),
      set: (k, v, ttl) => (ttl ? r.set(k, v, 'EX', ttl) : r.set(k, v)),
      del: (...keys) => r.del(...keys),
      incr: (k) => r.incr(k),
      expire: (k, s) => r.expire(k, s),
      ttl: (k) => r.ttl(k),
      setNxPx: (k, v, ttlMs) => r.set(k, v, 'PX', ttlMs, 'NX').then((res) => res === 'OK'),
    };
  }
  return null;
}

const backend: Backend | null = g.redisBackend ?? build();
if (process.env.NODE_ENV !== 'production') g.redisBackend = backend;

async function safe<T>(op: (b: Backend) => Promise<T>, fallback: T): Promise<T> {
  if (!backend) return fallback;
  try {
    return await op(backend);
  } catch {
    return fallback;
  }
}

export const redisConfigured = backend !== null;

export const redis = {
  get: (key: string) => safe((b) => b.get(key), null),
  set: (key: string, value: string, ttlSec?: number) => safe((b) => b.set(key, value, ttlSec), 'OK' as unknown),
  del: (...keys: string[]) => safe((b) => b.del(...keys), 0 as unknown),
  incr: (key: string) => safe((b) => b.incr(key), 1),
  expire: (key: string, seconds: number) => safe((b) => b.expire(key, seconds), 1 as unknown),
  ttl: (key: string) => safe((b) => b.ttl(key), -1),
  setNxPx: (key: string, value: string, ttlMs: number) => safe((b) => b.setNxPx(key, value, ttlMs), false),
};
