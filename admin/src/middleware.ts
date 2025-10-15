import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = 'sessionid';

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Skip middleware for API requests and static assets
    if (
        path.startsWith('/_next') ||
        path.startsWith('/api') ||
        path === '/favicon.ico' ||
        path.startsWith('/images') ||
        path.startsWith('/assets')
    ) {
        return NextResponse.next();
    }

    // Check for session cookie
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
    const hasCookie = !!sessionCookie?.value;
    const isLoginPage = path === '/login';

    if (!hasCookie && !isLoginPage) {
        const loginUrl = new URL('/login', req.url);
        if (path !== '/') {
            loginUrl.searchParams.set('return_to', path + req.nextUrl.search);
        }
        return NextResponse.redirect(loginUrl);
    }

    // If has cookie and trying to access login page, redirect to dashboard
    // (assuming they're logged in since they have a cookie)
    if (hasCookie && isLoginPage) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // For sensitive pages, we could add server-side validation
    // but for now, client-side validation should be sufficient
    const needsValidation = ['/admin/sensitive', '/admin/settings'].includes(path);
    
    // Since we're not making server-side requests anymore, 
    // we can't validate the session here without causing interference
    // Client-side validation will handle session expiration

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)',
    ]
};