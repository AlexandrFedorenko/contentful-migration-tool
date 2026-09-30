import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { notFound } from '@/server/http-error';

/** GET /api/admin/support/:id — one support ticket with its author. */
export default createApiHandler({
    GET: route({
        auth: 'admin',
        query: z.object({ id: z.string().uuid() }),
        handler: async (_req, _res, { query }) => {
            const request = await prisma.supportRequest.findUnique({
                where: { id: query.id },
                include: { user: { select: { id: true, displayName: true, email: true } } },
            });
            if (!request) throw notFound('Request');
            return request;
        },
    }),
});
