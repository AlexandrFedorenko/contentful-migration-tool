import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { HttpError } from '@/server/http-error';

const MAX_TEMPLATES = 100;

/** The current user's saved Visual Builder templates. */
export default createApiHandler({
    GET: route({
        handler: async (_req, _res, { user }) =>
            prisma.visualBuilderTemplate.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: MAX_TEMPLATES }),
    }),
    POST: route({
        body: z.object({
            name: z.string().trim().min(1).max(120),
            description: z.string().max(1000).optional(),
            content: z.array(z.record(z.string(), z.unknown())).max(200),
            category: z.string().max(40).optional(),
        }),
        rateLimit: { limit: 30, windowSeconds: 60 },
        handler: async (_req, res, { user, body }) => {
            if ((await prisma.visualBuilderTemplate.count({ where: { userId: user.id } })) >= MAX_TEMPLATES) {
                throw new HttpError(400, 'TEMPLATE_LIMIT', `You can store up to ${MAX_TEMPLATES} templates`);
            }
            if (JSON.stringify(body.content).length > 500_000) throw new HttpError(413, 'TEMPLATE_TOO_LARGE', 'Template is too large');
            res.status(201);
            return prisma.visualBuilderTemplate.create({
                data: {
                    userId: user.id,
                    name: body.name,
                    description: body.description,
                    content: body.content as Prisma.InputJsonValue,
                    category: body.category || 'custom',
                },
            });
        },
    }),
});
