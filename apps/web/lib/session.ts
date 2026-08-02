import 'server-only';
import type { WorkspaceContext } from '@adsos/db';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE = 'adsos_session';

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(s);
}

/** Read the current workspace context from the signed session cookie, or null. */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  if (!process.env.AUTH_SECRET) return null;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.workspaceId || !payload.userId || !payload.role) return null;
    return {
      workspaceId: String(payload.workspaceId),
      userId: String(payload.userId),
      role: payload.role as WorkspaceContext['role'],
    };
  } catch {
    return null;
  }
}

/** Mint a session cookie after sign-in / first connection. */
export async function setWorkspaceSession(ctx: WorkspaceContext): Promise<void> {
  const token = await new SignJWT({ workspaceId: ctx.workspaceId, userId: ctx.userId, role: ctx.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
