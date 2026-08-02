import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth gate. Workspace prefixes require a valid session; auth pages redirect a
 * signed-in user into the app. Using prefixes (not an allowlist) means a NEW
 * workspace page is protected by default (handyAds pattern).
 */
const PROTECTED = ['/dashboard', '/inbox', '/tools', '/audit', '/accounts', '/settings'];
const AUTH_PAGES = ['/signin', '/signup', '/forgot-password'];

const has = (list: string[], p: string) => list.some((x) => p === x || p.startsWith(`${x}/`));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.AUTH_SECRET;
  const token = request.cookies.get('adsos_session')?.value;

  // Without auth configured (pre-DB), let everything through so pages render
  // their own empty states rather than redirect-looping.
  if (!secret) return NextResponse.next();

  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (has(PROTECTED, pathname)) {
    if (valid) return NextResponse.next();
    const url = new URL('/signin', request.url);
    url.searchParams.set('next', pathname);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete('adsos_session');
    return res;
  }

  if (has(AUTH_PAGES, pathname) && valid) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webmanifest)$).*)'],
};
