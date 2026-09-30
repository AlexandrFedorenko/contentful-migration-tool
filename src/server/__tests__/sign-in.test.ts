/**
 * @jest-environment node
 */
import { mockReset, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

jest.mock('@/lib/db', () => ({ prisma: jest.requireActual('jest-mock-extended').mockDeep() }));
jest.mock('@/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('@/server/auth/session', () => ({ createSession: jest.fn(), clientIp: () => '127.0.0.1' }));
jest.mock('@/server/contentful/credentials', () => {
    const actual = jest.requireActual('@/server/contentful/credentials');
    return { ...actual, saveActiveToken: jest.fn() };
});

import { resetEnvCache } from '@/server/env';
import { createSession } from '@/server/auth/session';
import { saveActiveToken } from '@/server/contentful/credentials';
import { signInWithContentfulToken } from '@/server/auth/sign-in';
import { mockRequest } from './helpers';
import { prisma } from '@/lib/db';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const TOKEN = 'CFPAT-' + 'a'.repeat(40);

function mockContentful(status: number, body?: unknown) {
    global.fetch = jest.fn().mockResolvedValue({ ok: status < 300, status, json: async () => body }) as never;
}

describe('signInWithContentfulToken', () => {
    beforeEach(() => {
        mockReset(prismaMock);
        (createSession as jest.Mock).mockReset();
        prismaMock.$transaction.mockImplementation(((fn: (tx: unknown) => unknown) => fn(prismaMock)) as never);
        process.env.BOOTSTRAP_ADMIN_EMAILS = 'boss@example.com';
        resetEnvCache();
    });

    it('rejects tokens that Contentful does not accept', async () => {
        mockContentful(401);
        const { req, res } = mockRequest({ method: 'POST' });
        await expect(signInWithContentfulToken(req, res, TOKEN, 'PAT')).rejects.toMatchObject({ status: 401, code: 'TOKEN_REJECTED' });
        expect(createSession).not.toHaveBeenCalled();
    });

    it('creates a new user, stores the token and starts a session', async () => {
        mockContentful(200, { sys: { id: 'cf-1' }, email: 'New@Example.com', firstName: 'N' });
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({ id: 'u-new', email: 'new@example.com', suspendedAt: null } as never);

        const { req, res } = mockRequest({ method: 'POST' });
        const result = await signInWithContentfulToken(req, res, TOKEN, 'OAUTH');

        expect(result).toEqual({ userId: 'u-new', isNewUser: true });
        expect(prismaMock.user.create.mock.calls[0][0].data).toMatchObject({ email: 'new@example.com', contentfulUserId: 'cf-1' });
        expect(prismaMock.user.create.mock.calls[0][0].data).not.toHaveProperty('role');
        expect(saveActiveToken).toHaveBeenCalledWith('u-new', TOKEN, 'OAUTH', expect.any(String));
        expect(createSession).toHaveBeenCalled();
    });

    it('links an existing (legacy) account by email', async () => {
        mockContentful(200, { sys: { id: 'cf-2' }, email: 'old@example.com' });
        prismaMock.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'u-old', email: 'old@example.com', contentfulUserId: null } as never);
        prismaMock.user.update.mockResolvedValue({ id: 'u-old', email: 'old@example.com', suspendedAt: null } as never);

        const { req, res } = mockRequest({ method: 'POST' });
        await signInWithContentfulToken(req, res, TOKEN, 'PAT');
        expect(prismaMock.user.update.mock.calls[0][0].data).toMatchObject({ contentfulUserId: 'cf-2' });
    });

    it('grants ADMIN to bootstrap emails', async () => {
        mockContentful(200, { sys: { id: 'cf-3' }, email: 'boss@example.com' });
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({ id: 'u-boss', email: 'boss@example.com', suspendedAt: null } as never);
        const { req, res } = mockRequest({ method: 'POST' });
        await signInWithContentfulToken(req, res, TOKEN, 'PAT');
        expect(prismaMock.user.create.mock.calls[0][0].data).toMatchObject({ role: 'ADMIN' });
    });

    it('refuses suspended accounts', async () => {
        mockContentful(200, { sys: { id: 'cf-4' }, email: 'bad@example.com' });
        prismaMock.user.findUnique.mockResolvedValue({ id: 'u-bad', email: 'bad@example.com', contentfulUserId: 'cf-4' } as never);
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.update.mockResolvedValue({ id: 'u-bad', email: 'bad@example.com', suspendedAt: new Date() } as never);
        const { req, res } = mockRequest({ method: 'POST' });
        await expect(signInWithContentfulToken(req, res, TOKEN, 'PAT')).rejects.toMatchObject({ status: 403 });
        expect(createSession).not.toHaveBeenCalled();
    });
});
