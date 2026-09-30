/**
 * @jest-environment node
 */
import { z } from 'zod';
import { createApiHandler, route, publicErrorMessage } from '@/server/api';
import { HttpError } from '@/server/http-error';
import { getSessionUser } from '@/server/auth/session';
import { ADMIN, USER, json, mockRequest } from './helpers';

jest.mock('@/server/auth/session', () => ({
    getSessionUser: jest.fn(),
    clientIp: jest.fn(() => '127.0.0.1'),
}));

const session = getSessionUser as jest.Mock;

describe('createApiHandler', () => {
    beforeEach(() => session.mockReset());

    const handler = createApiHandler({
        GET: route({ handler: (_req, _res, { user }) => ({ id: user.id }) }),
        POST: route({
            body: z.object({ name: z.string().min(2) }),
            handler: (_req, _res, { body }) => ({ hello: body.name }),
        }),
        DELETE: route({ auth: 'admin', handler: () => ({ ok: true }) }),
        PUT: route({
            auth: 'public',
            handler: () => {
                throw new Error('database password is hunter2');
            },
        }),
        PATCH: route({
            auth: 'public',
            handler: () => {
                throw new HttpError(409, 'TARGET_BUSY', 'Busy');
            },
        }),
    });

    it('rejects unsupported methods with 405 and an Allow header', async () => {
        const handlerGetOnly = createApiHandler({ GET: route({ auth: 'public', handler: () => null }) });
        const { req, res } = mockRequest({ method: 'POST' });
        await handlerGetOnly(req, res);
        expect(res._getStatusCode()).toBe(405);
        expect(res.getHeader('Allow')).toBe('GET');
    });

    it('returns 401 without a session', async () => {
        session.mockResolvedValue(null);
        const { req, res } = mockRequest({});
        await handler(req, res);
        expect(res._getStatusCode()).toBe(401);
        expect(json(res).code).toBe('UNAUTHORIZED');
    });

    it('wraps the handler result in { success, data }', async () => {
        session.mockResolvedValue(USER);
        const { req, res } = mockRequest({});
        await handler(req, res);
        expect(res._getStatusCode()).toBe(200);
        expect(json(res)).toEqual({ success: true, data: { id: USER.id } });
    });

    it('validates the body with zod and reports field errors', async () => {
        session.mockResolvedValue(USER);
        const { req, res } = mockRequest({ method: 'POST', body: { name: 'x' } });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(json(res).code).toBe('VALIDATION_ERROR');
        expect(json(res).details[0].path).toBe('name');
    });

    it('requires the ADMIN role for admin routes', async () => {
        session.mockResolvedValue(USER);
        const { req, res } = mockRequest({ method: 'DELETE' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(403);

        session.mockResolvedValue(ADMIN);
        const second = mockRequest({ method: 'DELETE' });
        await handler(second.req, second.res);
        expect(second.res._getStatusCode()).toBe(200);
    });

    it('never leaks internal error messages', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const { req, res } = mockRequest({ method: 'PUT' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(500);
        expect(res._getData()).not.toContain('hunter2');
        spy.mockRestore();
    });

    it('maps HttpError to its status and code', async () => {
        const { req, res } = mockRequest({ method: 'PATCH' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(409);
        expect(json(res)).toMatchObject({ success: false, code: 'TARGET_BUSY', error: 'Busy' });
    });

    it('rate limits per user', async () => {
        session.mockResolvedValue(USER);
        const limited = createApiHandler({ GET: route({ rateLimit: { limit: 2, windowSeconds: 60, bucket: 'test-rl' }, handler: () => 1 }) });
        const codes: number[] = [];
        for (let i = 0; i < 3; i++) {
            const { req, res } = mockRequest({});
            await limited(req, res);
            codes.push(res._getStatusCode());
        }
        expect(codes).toEqual([200, 200, 429]);
    });
});

describe('publicErrorMessage', () => {
    it('summarizes Contentful SDK errors', () => {
        const err = new Error(JSON.stringify({ status: 404, statusText: 'Not Found', message: 'The resource could not be found.' }));
        expect(publicErrorMessage(err)).toBe('Contentful: The resource could not be found.');
    });

    it('hides messages that contain file system paths', () => {
        expect(publicErrorMessage(new Error('ENOENT /app/data/x.json'), 'fallback')).toBe('fallback');
    });
});
