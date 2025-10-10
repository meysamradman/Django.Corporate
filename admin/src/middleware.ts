import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = 'sessionid';

async function validateSession(sessionId: string, req: NextRequest): Promise<boolean> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) {
            console.error('API_BASE_URL not configured');
            return false;
        }

        const response = await fetch(`${baseUrl}/admin/profile/`, {
            method: 'GET',
            headers: {
                'Cookie': req.headers.get('cookie') || '',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        
        return response.ok;
    } catch (error) {
        console.error('Session validation failed:', error);
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

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

    // If has cookie and trying to access login page, validate session first
    if (hasCookie && isLoginPage) {
        const isValidSession = await validateSession(sessionCookie.value, req);
        if (isValidSession) {
            // Valid session exists, redirect to dashboard
            return NextResponse.redirect(new URL('/', req.url));
        } else {
            const response = NextResponse.next();
            response.cookies.set(SESSION_COOKIE_NAME, '', {
                expires: new Date(0),
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            return response;
        }
    }

    // ✅ فقط برای صفحات خاص session validation کن - نه همه navigation ها
    const needsValidation = ['/admin/sensitive', '/admin/settings'].includes(path);
    
    if (hasCookie && !isLoginPage && needsValidation) {
        const isValidSession = await validateSession(sessionCookie.value, req);
        if (!isValidSession) {
            const loginUrl = new URL('/login', req.url);
            if (path !== '/') {
                loginUrl.searchParams.set('return_to', path + req.nextUrl.search);
            }
            const response = NextResponse.redirect(loginUrl);
            // Clear the invalid session cookie securely
            response.cookies.set(SESSION_COOKIE_NAME, '', {
                expires: new Date(0),
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)',
    ]
};