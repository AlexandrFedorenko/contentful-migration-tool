/**
 * @jest-environment node
 */
import { mockReset, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import { sha256 } from '@/lib/encryption';

jest.mock('@/lib/db', () => ({ prisma: jest.requireActual('jest-mock-extended').mockDeep() }));

import { SESSION_COOKIE, createSession, getSessionUser, parseCookies } from '@/server/auth/session';
import { mockRequest } from './helpers';
import { prisma } from '@/lib/db';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const user = {
    id: 'u1', email: 'a@b.c', role: 'MEMBER', contentfulUserId: 'cf', firstName: null, lastName: null,
    displayName: null, avatarUrl: null, suspendedAt: null,
};

function reqWithCookie(value: string) {
    return mockRequest({ cookies: { [SESSION_COOKIE]: value } }).req;
}

describe('sessions', () => {
    beforeEach(() => mockReset(prismaMock));

    it('stores only the hash of the session secret and sets an HttpOnly cookie', async () => {
        const { req, res } = mockRequest({ headers: { 'user-agent': 'jest' } });
        prismaMock.session.create.mockResolvedValue({} as never);
        await createSession(res, req, 'u1');

        const cookie = String(res.getHeader('Set-Cookie'));
        expect(cookie).toMatch(/HttpOnly/);
        expect(cookie).toMatch(/SameSite=Lax/);
        const secret = decodeURIComponent(cookie.split(';')[0].split('=')[1]);
        const stored = prismaMock.session.create.mock.calls[0][0].data;
        expect(stored.id).toBe(sha256(secret));
        expect(stored.id).not.toBe(secret);
    });

    it('returns the user for a valid session', async () => {
        prismaMock.session.findUnique.mockResolvedValue({
            id: sha256('s1'), createdAt: new Date(), lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 60_000), user,
        } as never);
        const result = await getSessionUser(reqWithCookie('s1'));
        expect(result).toMatchObject({ id: 'u1', email: 'a@b.c', sessionId: sha256('s1') });
        expect(prismaMock.session.findUnique.mock.calls[0][0].where).toEqual({ id: sha256('s1') });
    });

    it('rejects and deletes expired sessions', async () => {
        prismaMock.session.findUnique.mockResolvedValue({
            id: sha256('s2'), createdAt: new Date(0), lastSeenAt: new Date(0), expiresAt: new Date(Date.now() - 1), user,
        } as never);
        prismaMock.session.delete.mockResolvedValue({} as never);
        expect(await getSessionUser(reqWithCookie('s2'))).toBeNull();
        expect(prismaMock.session.delete).toHaveBeenCalled();
    });

    it('rejects sessions of suspended users', async () => {
        prismaMock.session.findUnique.mockResolvedValue({
            id: sha256('s3'), createdAt: new Date(), lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 60_000),
            user: { ...user, suspendedAt: new Date() },
        } as never);
        prismaMock.session.delete.mockResolvedValue({} as never);
        expect(await getSessionUser(reqWithCookie('s3'))).toBeNull();
    });

    it('returns null without a cookie and never queries the database', async () => {
        expect(await getSessionUser(mockRequest({}).req)).toBeNull();
        expect(prismaMock.session.findUnique).not.toHaveBeenCalled();
    });

    it('parses cookie headers', () => {
        const req = { headers: { cookie: 'a=1; b=hello%20world' } } as never;
        expect(parseCookies(req)).toEqual({ a: '1', b: 'hello world' });
    });
});
