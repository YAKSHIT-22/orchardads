import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth gate for the workspace. Any of these prefixes requires a valid session
 * cookie - using prefixes (not an allowlist) means a NEW workspace page is
 * protected by default. Marketing, onboarding, api and assets stay public.
 */
const PROTECTED_PREFIXES = ['/dashboard', '/inbox', '/tools', '/audit', '/accounts', '/settings'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  const token = request.cookies.get('adsos_session')?.value;

  // No auth configured (local pre-DB) - let it through so the pages render their
  // own "connect an account" empty states rather than a redirect loop.
  if (!secret) return NextResponse.next();

  if (!token) {
    const url = new URL('/onboarding', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL('/onboarding', request.url));
    res.cookies.delete('adsos_session');
    return res;
  }
}

export const config = {
  // Run on everything except Next internals, api routes, and static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webmanifest)$).*)'],
};
