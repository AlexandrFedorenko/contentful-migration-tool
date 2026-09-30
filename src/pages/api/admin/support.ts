import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';

/** Support tickets for administrators. */
export default createApiHandler({
    GET: route({
        auth: 'admin',
        handler: async () =>
            prisma.supportRequest.findMany({
                orderBy: { createdAt: 'desc' },
                take: 500,
                include: { user: { select: { id: true, email: true, displayName: true } } },
            }),
    }),
    PUT: route({
        auth: 'admin',
        body: z.object({ id: z.string().uuid(), status: z.enum(['OPEN', 'RESOLVED']) }),
        handler: async (_req, _res, { body }) => prisma.supportRequest.update({ where: { id: body.id }, data: { status: body.status } }),
    }),
});
