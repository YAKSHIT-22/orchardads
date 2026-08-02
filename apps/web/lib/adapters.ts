import 'server-only';
import type { Platform } from '@adsos/core';
import { type WorkspaceContext, repositories } from '@adsos/db';
import type { AdsPlatformAdapter } from '@adsos/platform-core';
import { createTikTokAdapter } from '@adsos/platform-tiktok';
import { withLock } from './lock';
import { PROVIDERS, refreshTokens } from './oauth/config';
import { decryptToken, encryptToken } from './token';

const EXPIRY_BUFFER_MS = 60_000;

/**
 * Resolve a live access token for any platform, refreshing under a Redis lock when
 * expired. The refresh is serialized per connection and rotated tokens are persisted
 * before the old ones are discarded - critical for platforms that rotate refresh
 * tokens (ARCHITECTURE.md sec 10.2).
 */
async function resolveToken(platform: Platform, ctx: WorkspaceContext): Promise<string | null> {
  const conn = await repositories.connections.getConnection(ctx, platform);
  if (!conn || conn.status === 'REVOKED' || conn.status === 'SUSPENDED') return null;

  const valid = conn.accessTokenExpires != null && conn.accessTokenExpires.getTime() - Date.now() > EXPIRY_BUFFER_MS;
  if (valid) {
    try {
      return decryptToken(conn.accessTokenCipher, conn.accessTokenIv, conn.accessTokenTag);
    } catch {
      return null;
    }
  }

  return withLock(`refresh:${platform}:${conn.id}`, async () => {
    const fresh = await repositories.connections.getConnection(ctx, platform);
    if (!fresh) return null;
    if (fresh.accessTokenExpires != null && fresh.accessTokenExpires.getTime() - Date.now() > EXPIRY_BUFFER_MS) {
      return decryptToken(fresh.accessTokenCipher, fresh.accessTokenIv, fresh.accessTokenTag);
    }
    if (!fresh.refreshTokenCipher || !fresh.refreshTokenIv || !fresh.refreshTokenTag) {
      await repositories.connections.markStatus(ctx, fresh.id, 'NEEDS_REAUTH', 'No refresh token stored.');
      return null;
    }
    try {
      const refreshToken = decryptToken(fresh.refreshTokenCipher, fresh.refreshTokenIv, fresh.refreshTokenTag);
      const t = await refreshTokens(PROVIDERS[platform], refreshToken);
      const a = encryptToken(t.accessToken);
      const r = t.refreshToken ? encryptToken(t.refreshToken) : null;
      await repositories.connections.updateTokens(ctx, fresh.id, {
        accessTokenCipher: a.cipher,
        accessTokenIv: a.iv,
        accessTokenTag: a.tag,
        refreshTokenCipher: r?.cipher ?? null,
        refreshTokenIv: r?.iv ?? null,
        refreshTokenTag: r?.tag ?? null,
        accessTokenExpires: new Date(Date.now() + t.expiresIn * 1000),
      });
      return t.accessToken;
    } catch {
      await repositories.connections.markStatus(ctx, fresh.id, 'NEEDS_REAUTH', 'Token refresh failed.');
      return null;
    }
  });
}

/** Per-request adapter for any platform, bound to the caller's workspace connection. */
export function getAdapter(platform: Platform, ctx: WorkspaceContext): AdsPlatformAdapter {
  const deps = { getAccessToken: () => resolveToken(platform, ctx) };
  switch (platform) {
    case 'TIKTOK':
      return createTikTokAdapter(deps);
  }
}
