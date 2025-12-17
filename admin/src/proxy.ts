import { NextRequest, NextResponse } from "next/server";

/**
 * ✅ Next.js 16 Proxy (جایگزین middleware)
 * - lightweight routing guard
 * - فقط cookie check (NO database calls)
 * - در Node.js runtime اجرا میشه
 */

const SESSION_COOKIE = 'sessionid';
const CSRF_COOKIE = 'csrftoken';

const PUBLIC_PATHS = ['/login'];
const PUBLIC_PREFIXES = ['/_next', '/api', '/favicon.ico', '/images', '/assets'];

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Skip برای public resources
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // ❌ No auth + protected route → redirect to login
  if (!sessionCookie?.value && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('return_to', pathname + search);
    }
    
    const response = NextResponse.redirect(loginUrl);
    
    // ✅ پاک کردن cookies منقضی شده
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(CSRF_COOKIE);
    
    return response;
  }

  // ✅ اگر در صفحه login هستیم و cookie موجود است، cookie را پاک کن (session منقضی شده)
  if (isPublicPath && sessionCookie?.value) {
    const response = NextResponse.next();
    // پاک کردن cookie منقضی شده
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(CSRF_COOKIE);
    return response;
  }

  // ✅ Continue با security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|assets).*)',
  ]
};

