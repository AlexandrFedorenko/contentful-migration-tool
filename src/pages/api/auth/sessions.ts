import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';

/**
 * GET    /api/auth/sessions — active sessions of the current user
 * DELETE /api/auth/sessions — sign out everywhere except this device (or everywhere with ?all=1)
 */
export default createApiHandler({
    GET: route({
        handler: async (_req, _res, { user }) => {
            const sessions = await prisma.session.findMany({
                where: { userId: user.id, expiresAt: { gt: new Date() } },
                orderBy: { lastSeenAt: 'desc' },
                select: { id: true, createdAt: true, lastSeenAt: true, ip: true, userAgent: true },
            });
            return sessions.map(({ id, ...s }) => ({ ...s, current: id === user.sessionId, id: id.slice(0, 12) }));
        },
    }),
    DELETE: route({
        query: z.object({ all: z.enum(['1', 'true']).optional() }),
        handler: async (_req, _res, { user, query }) => {
            const { count } = await prisma.session.deleteMany({
                where: { userId: user.id, ...(query.all ? {} : { NOT: { id: user.sessionId } }) },
            });
            return { revoked: count };
        },
    }),
});
