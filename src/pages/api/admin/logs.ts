import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';

/** GET /api/admin/logs — paginated, filterable system log. */
export default createApiHandler({
    GET: route({
        auth: 'admin',
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(200).default(50),
            level: z.enum(['INFO', 'WARN', 'ERROR']).optional(),
            action: z.string().max(100).optional(),
            status: z.enum(['SUCCESS', 'FAILED']).optional(),
            search: z.string().max(200).optional(),
        }),
        handler: async (_req, _res, { query }) => {
            const where: Prisma.SystemLogWhereInput = {};
            if (query.level) where.level = query.level;
            if (query.action) where.action = query.action;
            if (query.status) where.status = query.status;
            if (query.search) {
                where.OR = [
                    { message: { contains: query.search, mode: 'insensitive' } },
                    { userEmail: { contains: query.search, mode: 'insensitive' } },
                    { action: { contains: query.search, mode: 'insensitive' } },
                ];
            }
            const [logs, total] = await Promise.all([
                prisma.systemLog.findMany({ where, orderBy: { timestamp: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }),
                prisma.systemLog.count({ where }),
            ]);
            return { logs, pagination: { total, pages: Math.ceil(total / query.limit), currentPage: query.page } };
        },
    }),
});
