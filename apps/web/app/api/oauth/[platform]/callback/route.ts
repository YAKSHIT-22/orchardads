import { ensureWorkspace, saveConnection } from '@/lib/bootstrap';
import { exchangeCode, providerBySlug } from '@/lib/oauth/config';
import { cookies } from 'next/headers';

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** OAuth callback for any platform: verify state, exchange code, persist tokens. */
export async function GET(req: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const cfg = providerBySlug(platform);
  if (!cfg) return Response.redirect(`${APP}/onboarding?error=unknown_platform`);

  const url = new URL(req.url);
  // TikTok returns the code as `auth_code`; standard OAuth2 uses `code`.
  const code = url.searchParams.get('code') ?? url.searchParams.get('auth_code');
  const state = url.searchParams.get('state');
  const jar = await cookies();
  const stored = jar.get('oauth_state')?.value;

  if (!code || !state || state !== stored || !state.startsWith(`${cfg.platform}:`)) {
    return Response.redirect(`${APP}/onboarding?error=oauth_state`);
  }
  try {
    const tokens = await exchangeCode(cfg, code);
    const ctx = await ensureWorkspace();
    await saveConnection(ctx, cfg.platform, cfg.scopes, cfg.apiVersion, tokens);
    jar.delete('oauth_state');
    return Response.redirect(`${APP}/onboarding?connected=${cfg.platform.toLowerCase()}`);
  } catch (e) {
    return Response.redirect(`${APP}/onboarding?error=${encodeURIComponent(String((e as Error).message))}`);
  }
}
