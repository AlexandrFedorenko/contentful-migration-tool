import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { logger } from '@/utils/logger';

const PUBLIC_FIELDS = {
    betaBannerEnabled: true, betaBannerText: true, tickerEnabled: true, tickerText: true,
    maxAssetSizeMB: true, maxBackupsPerUser: true, enableAssetBackups: true, updatedAt: true,
} as const;

/**
 * GET  /api/settings — public app settings (banner, ticker, limits); readable without a session.
 * POST /api/settings — update them (admin).
 */
export default createApiHandler({
    GET: route({
        auth: 'public',
        handler: async () =>
            (await prisma.appSettings.findUnique({ where: { id: 'default' }, select: PUBLIC_FIELDS })) ??
            prisma.appSettings.create({ data: { id: 'default' }, select: PUBLIC_FIELDS }),
    }),
    POST: route({
        auth: 'admin',
        body: z.object({
            betaBannerEnabled: z.boolean().optional(),
            betaBannerText: z.string().max(300).optional(),
            tickerEnabled: z.boolean().optional(),
            tickerText: z.string().max(500).optional(),
            maxAssetSizeMB: z.coerce.number().int().min(1).max(20_480).optional(),
            maxBackupsPerUser: z.coerce.number().int().min(0).max(100).optional(),
            enableAssetBackups: z.boolean().optional(),
        }),
        handler: async (_req, _res, { user, body }) => {
            const settings = await prisma.appSettings.upsert({
                where: { id: 'default' },
                update: { ...body, updatedBy: user.id },
                create: { id: 'default', ...body, updatedBy: user.id },
                select: PUBLIC_FIELDS,
            });
            await logger.info('ADMIN_SETTINGS_UPDATE', 'App settings updated', body, user);
            return settings;
        },
    }),
});
