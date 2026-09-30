import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { logger } from '@/utils/logger';

const MONTHS = { '1m': 1, '3m': 3, '6m': 6 } as const;

/** POST /api/admin/clear-logs { retention: '1m' | '3m' | '6m' | 'all' } — delete old system logs. */
export default createApiHandler({
    POST: route({
        auth: 'admin',
        body: z.object({ retention: z.enum(['1m', '3m', '6m', 'all']) }),
        handler: async (_req, _res, { user, body }) => {
            let where: Prisma.SystemLogWhereInput = {};
            if (body.retention !== 'all') {
                const cutoff = new Date();
                cutoff.setMonth(cutoff.getMonth() - MONTHS[body.retention]);
                where = { timestamp: { lt: cutoff } };
            }
            const { count } = await prisma.systemLog.deleteMany({ where });
            await logger.info('ADMIN_CLEAR_LOGS', `Deleted ${count} logs (retention ${body.retention})`, { count }, user);
            return { count, message: `Successfully deleted ${count} logs` };
        },
    }),
});
