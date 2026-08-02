import 'server-only';
import type { Platform } from '@adsos/core';

type Flavor = 'oauth2' | 'tiktok';

export type OAuthProvider = {
  platform: Platform;
  flavor: Flavor;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  apiVersion: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  extraAuthParams?: Record<string, string>;
};

const APP = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * OAuth config per platform. TikTok uses a non-standard flow (app_id/secret,
 * auth_code param, JSON token exchange, long-lived token). The generic 'oauth2'
 * flavor is kept for future frictionless platforms.
 */
export const PROVIDERS: Record<Platform, OAuthProvider> = {
  TIKTOK: {
    platform: 'TIKTOK',
    flavor: 'tiktok',
    authorizeUrl: 'https://business-api.tiktok.com/portal/auth',
    tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
    scopes: [], // TikTok scopes are set on the app in the developer portal
    apiVersion: 'v1.3',
    clientIdEnv: 'TIKTOK_CLIENT_ID',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
  },
};

export function providerBySlug(slug: string): OAuthProvider | null {
  const p = slug.toUpperCase() as Platform;
  return PROVIDERS[p] ?? null;
}

export function isConfigured(cfg: OAuthProvider): boolean {
  return Boolean(process.env[cfg.clientIdEnv] && process.env[cfg.clientSecretEnv]);
}

function redirectUri(cfg: OAuthProvider): string {
  return `${APP()}/api/oauth/${cfg.platform.toLowerCase()}/callback`;
}

export function authorizeUrl(cfg: OAuthProvider, state: string): string {
  if (cfg.flavor === 'tiktok') {
    const p = new URLSearchParams({
      app_id: process.env[cfg.clientIdEnv] ?? '',
      state,
      redirect_uri: redirectUri(cfg),
    });
    return `${cfg.authorizeUrl}?${p.toString()}`;
  }
  const p = new URLSearchParams({
    client_id: process.env[cfg.clientIdEnv] ?? '',
    response_type: 'code',
    state,
    redirect_uri: redirectUri(cfg),
    ...(cfg.scopes.length ? { scope: cfg.scopes.join(' ') } : {}),
    ...(cfg.extraAuthParams ?? {}),
  });
  return `${cfg.authorizeUrl}?${p.toString()}`;
}

export type Tokens = { accessToken: string; refreshToken: string | null; expiresIn: number };

const LONG_LIVED = 60 * 60 * 24 * 365; // TikTok access tokens are long-lived

export async function exchangeCode(cfg: OAuthProvider, code: string): Promise<Tokens> {
  if (cfg.flavor === 'tiktok') {
    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        app_id: process.env[cfg.clientIdEnv],
        secret: process.env[cfg.clientSecretEnv],
        auth_code: code,
      }),
    });
    const j = (await res.json()) as { code?: number; data?: { access_token?: string; refresh_token?: string } };
    if (!res.ok || j.code !== 0 || !j.data?.access_token) throw new Error('TikTok token exchange failed.');
    return { accessToken: j.data.access_token, refreshToken: j.data.refresh_token ?? null, expiresIn: LONG_LIVED };
  }
  // Generic OAuth2 (form-encoded) - unused until a frictionless platform is added.
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(cfg) }),
  });
  const j = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  return { accessToken: j.access_token, refreshToken: j.refresh_token ?? null, expiresIn: j.expires_in ?? 3600 };
}

/** TikTok access tokens are long-lived and not refreshed via this flow. */
export async function refreshTokens(_cfg: OAuthProvider, refreshToken: string): Promise<Tokens> {
  return { accessToken: '', refreshToken, expiresIn: LONG_LIVED };
}
