import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge middleware:
 *  1. Blocks cross-site state-changing API requests (CSRF defence in depth on top of SameSite=Lax).
 *  2. Redirects anonymous visitors to /sign-in (cheap cookie presence check; the session itself
 *     is validated against the database in every API handler).
 *  3. Sets the Content-Security-Policy. Pages Router production builds contain no inline
 *     executable scripts (__NEXT_DATA__ is application/json), so script-src can stay strict
 *     without nonces and pages remain statically optimized.
 */

const SESSION_COOKIES = ['__Host-cmt_sid', 'cmt_sid'];
const PUBLIC_PAGES = ['/sign-in', '/auth/callback', '/doc', '/404', '/500'];
const PUBLIC_API = ['/api/auth/', '/api/health', '/api/settings'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isPublic(pathname: string): boolean {
    if (pathname.startsWith('/api/')) return PUBLIC_API.some((p) => pathname.startsWith(p));
    return PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isCrossSite(req: NextRequest): boolean {
    const site = req.headers.get('sec-fetch-site');
    if (site && site !== 'same-origin' && site !== 'none') return true;
    const origin = req.headers.get('origin');
    if (!origin) return false;
    try {
        return new URL(origin).host !== req.headers.get('host');
    } catch {
        return true;
    }
}

function buildCsp(): string {
    const dev = process.env.NODE_ENV !== 'production';
    return [
        `default-src 'self'`,
        // jsDelivr serves the Monaco editor used by the Visual Builder; dev needs eval/inline for HMR
        `script-src 'self' https://cdn.jsdelivr.net${dev ? " 'unsafe-eval' 'unsafe-inline'" : ''}`,
        `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
        `img-src 'self' data: blob: https:`,
        `font-src 'self' data: https://cdn.jsdelivr.net`,
        `connect-src 'self' https://*.ctfassets.net https://cdn.jsdelivr.net${dev ? ' ws:' : ''}`,
        `worker-src 'self' blob:`,
        `frame-ancestors 'none'`,
        `form-action 'self' https://be.contentful.com`,
        `base-uri 'self'`,
        `object-src 'none'`,
        ...(dev ? [] : ['upgrade-insecure-requests']),
    ].join('; ');
}

export function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const isApi = pathname.startsWith('/api/');

    if (isApi && !SAFE_METHODS.has(req.method) && isCrossSite(req)) {
        return NextResponse.json({ success: false, code: 'CROSS_SITE_REQUEST', error: 'Cross-site request blocked' }, { status: 403 });
    }

    const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
    if (!hasSession && !isPublic(pathname)) {
        if (isApi) {
            return NextResponse.json({ success: false, code: 'UNAUTHORIZED', error: 'Sign in required' }, { status: 401 });
        }
        const url = req.nextUrl.clone();
        url.pathname = '/sign-in';
        url.search = pathname === '/' ? '' : `?returnTo=${encodeURIComponent(pathname + search)}`;
        return NextResponse.redirect(url);
    }

    if (isApi) return NextResponse.next();

    const res = NextResponse.next();
    res.headers.set('Content-Security-Policy', buildCsp());
    return res;
}

export const config = {
    matcher: [
        // Everything except Next internals and static files
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|woff2?)$).*)',
    ],
};
