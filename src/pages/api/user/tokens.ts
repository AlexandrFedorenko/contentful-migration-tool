import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { HttpError, notFound } from '@/server/http-error';
import { encryptToken, fetchContentfulProfile } from '@/server/contentful/credentials';

const MAX_TOKENS = 10;
const PUBLIC_FIELDS = { id: true, alias: true, kind: true, isActive: true, lastUsedAt: true, createdAt: true, updatedAt: true } as const;

async function ownToken(userId: string, id: string) {
    const token = await prisma.contentfulToken.findFirst({ where: { id, userId }, select: { id: true, isActive: true } });
    if (!token) throw notFound('Token');
    return token;
}

/**
 * Contentful connections of the current user. Token values are write-only:
 * they are validated with Contentful, stored encrypted and never returned.
 */
export default createApiHandler({
    GET: route({
        handler: async (_req, _res, { user }) =>
            prisma.contentfulToken.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, select: PUBLIC_FIELDS }),
    }),

    POST: route({
        body: z.object({ alias: z.string().trim().min(1).max(60), token: z.string().trim().min(20).max(200) }),
        rateLimit: { limit: 10, windowSeconds: 60 },
        handler: async (_req, res, { user, body }) => {
            if ((await prisma.contentfulToken.count({ where: { userId: user.id } })) >= MAX_TOKENS) {
                throw new HttpError(400, 'TOKEN_LIMIT', `You can store up to ${MAX_TOKENS} tokens`);
            }
            await fetchContentfulProfile(body.token);
            const created = await prisma.contentfulToken.create({
                data: { userId: user.id, alias: body.alias, token: encryptToken(user.id, body.token), kind: 'PAT', isActive: false },
                select: PUBLIC_FIELDS,
            });
            res.status(201);
            return created;
        },
    }),

    PUT: route({
        body: z.discriminatedUnion('action', [
            z.object({ action: z.literal('rename'), id: z.string().uuid(), alias: z.string().trim().min(1).max(60) }),
            z.object({ action: z.literal('activate'), id: z.string().uuid() }),
        ]),
        handler: async (_req, _res, { user, body }) => {
            await ownToken(user.id, body.id);
            if (body.action === 'rename') {
                return prisma.contentfulToken.update({ where: { id: body.id }, data: { alias: body.alias }, select: PUBLIC_FIELDS });
            }
            await prisma.$transaction([
                prisma.contentfulToken.updateMany({ where: { userId: user.id }, data: { isActive: false } }),
                prisma.contentfulToken.update({ where: { id: body.id }, data: { isActive: true } }),
            ]);
            return { message: 'Token activated' };
        },
    }),

    DELETE: route({
        query: z.object({ id: z.string().uuid() }),
        handler: async (_req, _res, { user, query }) => {
            const target = await ownToken(user.id, query.id);
            await prisma.$transaction(async (tx) => {
                await tx.contentfulToken.delete({ where: { id: target.id } });
                if (target.isActive) {
                    const next = await tx.contentfulToken.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
                    if (next) await tx.contentfulToken.update({ where: { id: next.id }, data: { isActive: true } });
                }
            });
            return { message: 'Token deleted' };
        },
    }),
});
