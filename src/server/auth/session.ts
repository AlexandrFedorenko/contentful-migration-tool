import type { IncomingMessage, ServerResponse } from 'http';
import type { NextApiRequest } from 'next';
import type { Role } from '@prisma/client';
import { prisma } from '@/lib/db';
import { randomToken, sha256 } from '@/lib/encryption';
import { getEnv, isProduction } from '@/server/env';

/** Cookie names. `__Host-` requires Secure + Path=/ + no Domain, so it is production-only. */
export const SESSION_COOKIE = isProduction() ? '__Host-cmt_sid' : 'cmt_sid';
export const OAUTH_STATE_COOKIE = isProduction() ? '__Host-cmt_oauth' : 'cmt_oauth';

const DAY = 24 * 60 * 60 * 1000;
/** Refresh `lastSeenAt` / sliding expiry at most this often, to avoid a write per request. */
const TOUCH_INTERVAL_MS = 15 * 60 * 1000;
/** A session can never live longer than this, regardless of activity. */
const ABSOLUTE_LIFETIME_MS = 30 * DAY;

export interface SessionUser {
    id: string;
    email: string;
    role: Role;
    contentfulUserId: string | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    sessionId: string;
}

type ReqLike = IncomingMessage & { cookies?: Partial<Record<string, string>> };
const CACHE = Symbol('sessionUser');

export function parseCookies(req: ReqLike): Record<string, string> {
    if (req.cookies) return req.cookies as Record<string, string>;
    const out: Record<string, string> = {};
    for (const part of (req.headers.cookie || '').split(';')) {
        const idx = part.indexOf('=');
        if (idx < 0) continue;
        const k = part.slice(0, idx).trim();
        if (k) out[k] = decodeURIComponent(part.slice(idx + 1).trim());
    }
    return out;
}

export function serializeCookie(
    name: string,
    value: string,
    opts: { maxAgeSeconds?: number; httpOnly?: boolean; sameSite?: 'Lax' | 'Strict'; path?: string } = {}
): string {
    const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${opts.path ?? '/'}`, `SameSite=${opts.sameSite ?? 'Lax'}`];
    if (opts.httpOnly !== false) parts.push('HttpOnly');
    if (isProduction()) parts.push('Secure');
    if (opts.maxAgeSeconds !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(opts.maxAgeSeconds))}`);
    return parts.join('; ');
}

export function appendSetCookie(res: ServerResponse, cookie: string): void {
    const prev = res.getHeader('Set-Cookie');
    const list = Array.isArray(prev) ? prev : prev ? [String(prev)] : [];
    res.setHeader('Set-Cookie', [...list, cookie]);
}

export function clientIp(req: IncomingMessage): string | undefined {
    const hops = getEnv().TRUST_PROXY_HOPS;
    if (hops > 0) {
        const fwd = String(req.headers['x-forwarded-for'] || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (fwd.length >= hops) return fwd[fwd.length - hops];
    }
    return req.socket?.remoteAddress || undefined;
}

export async function createSession(res: ServerResponse, req: IncomingMessage, userId: string): Promise<void> {
    const secret = randomToken(32);
    const ttlMs = getEnv().SESSION_TTL_DAYS * DAY;
    await prisma.session.create({
        data: {
            id: sha256(secret),
            userId,
            expiresAt: new Date(Date.now() + ttlMs),
            ip: clientIp(req),
            userAgent: String(req.headers['user-agent'] || '').slice(0, 300) || null,
        },
    });
    appendSetCookie(res, serializeCookie(SESSION_COOKIE, secret, { maxAgeSeconds: ttlMs / 1000 }));
}

export async function destroySession(req: ReqLike, res: ServerResponse): Promise<void> {
    const secret = parseCookies(req)[SESSION_COOKIE];
    if (secret) await prisma.session.deleteMany({ where: { id: sha256(secret) } });
    appendSetCookie(res, serializeCookie(SESSION_COOKIE, '', { maxAgeSeconds: 0 }));
}

/**
 * Resolve the signed-in user from the session cookie. Returns null for missing,
 * expired or revoked sessions and for suspended users. Cached per request.
 */
export async function getSessionUser(req: ReqLike): Promise<SessionUser | null> {
    const cached = (req as unknown as Record<symbol, SessionUser | null | undefined>)[CACHE];
    if (cached !== undefined) return cached;

    const result = await loadSessionUser(req);
    (req as unknown as Record<symbol, SessionUser | null>)[CACHE] = result;
    return result;
}

async function loadSessionUser(req: ReqLike): Promise<SessionUser | null> {
    const secret = parseCookies(req)[SESSION_COOKIE];
    if (!secret || secret.length > 100) return null;

    const id = sha256(secret);
    const session = await prisma.session.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true, email: true, role: true, contentfulUserId: true, firstName: true,
                    lastName: true, displayName: true, avatarUrl: true, suspendedAt: true,
                },
            },
        },
    });
    if (!session) return null;

    const now = Date.now();
    if (session.expiresAt.getTime() <= now || session.user.suspendedAt) {
        await prisma.session.delete({ where: { id } }).catch(() => undefined);
        return null;
    }

    if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
        const ttlMs = getEnv().SESSION_TTL_DAYS * DAY;
        const cap = session.createdAt.getTime() + ABSOLUTE_LIFETIME_MS;
        await prisma.session
            .update({ where: { id }, data: { lastSeenAt: new Date(now), expiresAt: new Date(Math.min(now + ttlMs, cap)) } })
            .catch(() => undefined);
    }

    const { suspendedAt: _suspended, ...user } = session.user;
    return { ...user, sessionId: id };
}

/**
 * Compatibility shim with the previous Clerk API so route handlers can migrate gradually:
 * `const { userId } = await getAuth(req)` where userId is the internal User.id.
 */
export async function getAuth(req: NextApiRequest | ReqLike): Promise<{ userId: string | null; user: SessionUser | null }> {
    const user = await getSessionUser(req as ReqLike);
    return { userId: user?.id ?? null, user };
}
