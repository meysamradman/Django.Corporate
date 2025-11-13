import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = 'sessionid';
const CSRF_COOKIE_NAME = 'csrftoken';

const PUBLIC_PATHS = ['/login'];
const PUBLIC_PREFIXES = ['/_next', '/api', '/favicon.ico', '/images', '/assets'];

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
  const csrfCookie = req.cookies.get(CSRF_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie?.value;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('return_to', pathname + search);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isAuthenticated) {
    const response = NextResponse.next();
    
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    const method = req.method;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const csrfHeader = req.headers.get('X-CSRFToken');
      if (!csrfHeader && !csrfCookie?.value) {
        console.warn('[Middleware] Missing CSRF token for', method, pathname);
      }
    }
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|assets).*)',
  ]
};