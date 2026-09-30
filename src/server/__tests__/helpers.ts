import { createMocks, type RequestMethod } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { SessionUser } from '@/server/auth/session';

export const USER: SessionUser = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'user@example.com',
    role: 'MEMBER',
    contentfulUserId: 'cf-user',
    firstName: 'Test',
    lastName: 'User',
    displayName: null,
    avatarUrl: null,
    sessionId: 'session-hash',
};

export const ADMIN: SessionUser = { ...USER, id: '22222222-2222-4222-8222-222222222222', email: 'admin@example.com', role: 'ADMIN' };

export function mockRequest(opts: {
    method?: RequestMethod;
    body?: unknown;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
}) {
    return createMocks<NextApiRequest & { _getData?: () => string }, NextApiResponse & { _getData: () => string; _getStatusCode: () => number }>({
        method: opts.method ?? 'GET',
        body: opts.body as never,
        query: opts.query ?? {},
        headers: opts.headers ?? {},
        cookies: opts.cookies ?? {},
    });
}

export function json(res: { _getData: () => unknown }) {
    const data = res._getData();
    return typeof data === 'string' ? JSON.parse(data) : data;
}
