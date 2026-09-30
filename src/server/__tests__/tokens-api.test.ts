/**
 * @jest-environment node
 */
import { mockReset, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

jest.mock('@/lib/db', () => ({ prisma: jest.requireActual('jest-mock-extended').mockDeep() }));
jest.mock('@/server/auth/session', () => ({ getSessionUser: jest.fn(), clientIp: () => '127.0.0.1' }));

import handler from '@/pages/api/user/tokens';
import { getSessionUser } from '@/server/auth/session';
import { USER, json, mockRequest } from './helpers';
import { prisma } from '@/lib/db';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const TOKEN_ID = '33333333-3333-4333-8333-333333333333';

describe('/api/user/tokens', () => {
    beforeEach(() => {
        mockReset(prismaMock);
        (getSessionUser as jest.Mock).mockResolvedValue(USER);
    });

    it('never returns token values', async () => {
        prismaMock.contentfulToken.findMany.mockResolvedValue([] as never);
        const { req, res } = mockRequest({});
        await handler(req, res);
        const select = prismaMock.contentfulToken.findMany.mock.calls[0][0]!.select!;
        expect(select).not.toHaveProperty('token');
        expect(res._getStatusCode()).toBe(200);
    });

    it("cannot rename another user's token (IDOR)", async () => {
        prismaMock.contentfulToken.findFirst.mockResolvedValue(null);
        const { req, res } = mockRequest({ method: 'PUT', body: { action: 'rename', id: TOKEN_ID, alias: 'mine now' } });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(404);
        expect(prismaMock.contentfulToken.findFirst.mock.calls[0][0]!.where).toEqual({ id: TOKEN_ID, userId: USER.id });
        expect(prismaMock.contentfulToken.update).not.toHaveBeenCalled();
    });

    it("cannot delete another user's token", async () => {
        prismaMock.contentfulToken.findFirst.mockResolvedValue(null);
        const { req, res } = mockRequest({ method: 'DELETE', query: { id: TOKEN_ID } });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(404);
        expect(json(res).code).toBe('NOT_FOUND');
    });

    it('rejects unknown actions', async () => {
        const { req, res } = mockRequest({ method: 'PUT', body: { action: 'steal', id: TOKEN_ID } });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });
});
