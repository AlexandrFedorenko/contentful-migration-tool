import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';

/** GET /api/jobs — recent operations of the current user. */
export default createApiHandler({
    GET: route({
        query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }),
        handler: async (_req, _res, { user, query }) =>
            prisma.job.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: query.limit,
                select: { id: true, type: true, status: true, error: true, createdAt: true, startedAt: true, finishedAt: true },
            }),
    }),
});
