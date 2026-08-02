import { authorizeUrl, isConfigured, providerBySlug } from '@/lib/oauth/config';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Start OAuth for any platform. Stores a CSRF state cookie, redirects to consent. */
export async function GET(_req: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const cfg = providerBySlug(platform);
  if (!cfg) return Response.json({ error: 'Unknown platform.' }, { status: 404 });
  if (!isConfigured(cfg)) {
    return Response.redirect(`${APP}/onboarding?error=${platform.toLowerCase()}_not_configured`);
  }
  const state = `${cfg.platform}:${randomBytes(16).toString('hex')}`;
  const jar = await cookies();
  jar.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return Response.redirect(authorizeUrl(cfg, state));
}
