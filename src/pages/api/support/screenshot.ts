import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { forbidden, notFound } from '@/server/http-error';
import * as storage from '@/server/storage';

/** GET /api/support/screenshot?id= — ticket screenshot for its author or an administrator. */
export default createApiHandler({
    GET: route({
        query: z.object({ id: z.string().uuid() }),
        handler: async (_req, res, { user, query }) => {
            const ticket = await prisma.supportRequest.findUnique({ where: { id: query.id }, select: { id: true, userId: true } });
            if (!ticket) throw notFound('Screenshot');
            if (ticket.userId !== user.id && user.role !== 'ADMIN') throw forbidden();
            for (const ext of ['png', 'jpg'] as const) {
                const key = ['support', `${ticket.id}.${ext}`];
                if (await storage.exists(key)) {
                    res.setHeader('Content-Type', ext === 'png' ? 'image/png' : 'image/jpeg');
                    res.setHeader('Cache-Control', 'private, max-age=3600');
                    res.setHeader('Content-Security-Policy', "default-src 'none'");
                    await new Promise<void>((resolve, reject) => storage.createReadStream(key).on('error', reject).pipe(res).on('finish', resolve));
                    return;
                }
            }
            throw notFound('Screenshot');
        },
    }),
});
