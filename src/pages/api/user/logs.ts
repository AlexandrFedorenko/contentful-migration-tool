import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';

/** The current user's activity log. */
export default createApiHandler({
    GET: route({
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.union([z.literal('all'), z.coerce.number().int().min(1).max(200)]).default(15),
            level: z.string().max(10).optional(),
            status: z.string().max(10).optional(),
            search: z.string().max(200).optional(),
        }),
        handler: async (_req, _res, { user, query }) => {
            // "all" is used for CSV export; still capped to keep the response bounded.
            const take = query.limit === 'all' ? 5000 : query.limit;
            const skip = query.limit === 'all' ? 0 : (query.page - 1) * take;
            const where: Prisma.SystemLogWhereInput = { userId: user.id };
            if (query.level && query.level !== 'ALL') where.level = query.level;
            if (query.status && query.status !== 'ALL') where.status = query.status;
            if (query.search) {
                where.OR = [
                    { message: { contains: query.search, mode: 'insensitive' } },
                    { action: { contains: query.search, mode: 'insensitive' } },
                ];
            }
            const [logs, total] = await Promise.all([
                prisma.systemLog.findMany({
                    where,
                    orderBy: { timestamp: 'desc' },
                    skip,
                    take,
                    select: { id: true, level: true, action: true, message: true, details: true, status: true, timestamp: true, logFile: true },
                }),
                prisma.systemLog.count({ where }),
            ]);
            return { logs, total, page: query.page, totalPages: query.limit === 'all' ? 1 : Math.ceil(total / take) };
        },
    }),
    DELETE: route({
        handler: async (_req, _res, { user }) => {
            await prisma.systemLog.deleteMany({ where: { userId: user.id } });
            return { message: 'All logs cleared' };
        },
    }),
});
