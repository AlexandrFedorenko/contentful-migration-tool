import type { NextApiRequest, NextApiResponse } from 'next';
import { ZodError, type ZodType } from 'zod';
import { getSessionUser, clientIp, type SessionUser } from '@/server/auth/session';
import { HttpError, forbidden, unauthorized } from '@/server/http-error';
import { hitRateLimit } from '@/server/rate-limit';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiContext<TBody, TQuery> {
    user: SessionUser;
    body: TBody;
    query: TQuery;
    ip: string | undefined;
}

interface RouteConfig<TBody, TQuery> {
    /** 'public' skips authentication; 'admin' requires role ADMIN. */
    auth?: 'public' | 'user' | 'admin';
    body?: ZodType<TBody>;
    query?: ZodType<TQuery>;
    /** Requests per window per user (or per IP for public routes). */
    rateLimit?: { limit: number; windowSeconds: number; bucket?: string };
    handler: (req: NextApiRequest, res: NextApiResponse, ctx: ApiContext<TBody, TQuery>) => Promise<unknown> | unknown;
}

type Routes = Partial<Record<Method, RouteConfig<any, any>>>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Define one method of a route with full type inference for body/query. */
export function route<TBody = unknown, TQuery = unknown>(config: RouteConfig<TBody, TQuery>): RouteConfig<TBody, TQuery> {
    return config;
}

/**
 * Single request pipeline for API routes:
 * method check → auth/role → rate limit → zod validation → handler → uniform errors.
 *
 * Handlers either write to `res` themselves or return a value that is sent as
 * `{ success: true, data }`. Thrown HttpErrors become `{ success: false, error, code }`;
 * anything else is logged and returned as a generic 500 without internal details.
 */
export function createApiHandler(routes: Routes) {
    return async function handler(req: NextApiRequest, res: NextApiResponse) {
        const method = (req.method || 'GET').toUpperCase() as Method;
        const config = routes[method];
        if (!config) {
            res.setHeader('Allow', Object.keys(routes).join(', '));
            return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' });
        }

        try {
            const ip = clientIp(req);
            let user: SessionUser | null = null;
            const auth = config.auth ?? 'user';
            if (auth !== 'public') {
                user = await getSessionUser(req);
                if (!user) throw unauthorized();
                if (auth === 'admin' && user.role !== 'ADMIN') throw forbidden();
            }

            if (config.rateLimit) {
                const { limit, windowSeconds, bucket } = config.rateLimit;
                const who = user?.id ?? ip ?? 'anon';
                const key = `${bucket ?? req.url?.split('?')[0]}:${method}:${who}`;
                const rl = await hitRateLimit(key, limit, windowSeconds);
                res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
                if (!rl.allowed) {
                    res.setHeader('Retry-After', String(rl.resetSeconds));
                    throw new HttpError(429, 'RATE_LIMITED', 'Too many requests, please slow down');
                }
            }

            const body = config.body ? config.body.parse(req.body ?? {}) : req.body;
            const query = config.query ? config.query.parse(req.query ?? {}) : req.query;

            const result = await config.handler(req, res, { user: user as SessionUser, body, query, ip });
            if (!res.headersSent && !res.writableEnded) {
                res.status(200).json({ success: true, data: result ?? null });
            }
        } catch (error) {
            sendError(res, error);
        }
    };
}

export function sendError(res: NextApiResponse, error: unknown): void {
    if (res.headersSent) {
        if (!res.writableEnded) res.end();
        return;
    }
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            error: 'Invalid request',
            details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
        return;
    }
    if (error instanceof HttpError) {
        res.status(error.status).json({ success: false, code: error.code, error: error.message, details: error.details });
        return;
    }
    console.error('[api] unhandled error', error);
    res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Internal server error' });
}

/**
 * For routes not yet migrated to createApiHandler: resolve the user or send 401/403.
 * Returns null when a response has already been sent.
 */
export async function requireUser(
    req: NextApiRequest,
    res: NextApiResponse,
    opts: { admin?: boolean } = {}
): Promise<SessionUser | null> {
    const user = await getSessionUser(req);
    if (!user) {
        res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Sign in required' });
        return null;
    }
    if (opts.admin && user.role !== 'ADMIN') {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'Forbidden' });
        return null;
    }
    return user;
}

/** Message safe to return to clients for errors coming from Contentful or our own code. */
export function publicErrorMessage(error: unknown, fallback = 'Operation failed'): string {
    if (error instanceof HttpError) return error.message;
    // contentful-management errors carry a JSON message with status info; expose only the summary.
    if (error && typeof error === 'object' && 'message' in error) {
        const raw = String((error as Error).message);
        try {
            const parsed = JSON.parse(raw) as { status?: number; statusText?: string; message?: string };
            if (parsed.statusText || parsed.message) return `Contentful: ${parsed.message || parsed.statusText}`;
        } catch {
            /* not JSON */
        }
        if (raw.length < 300 && !/\/(home|app|usr|var)\//.test(raw)) return raw;
    }
    return fallback;
}
