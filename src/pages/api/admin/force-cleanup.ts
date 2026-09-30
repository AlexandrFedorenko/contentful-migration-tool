import { createApiHandler, route } from '@/server/api';
import * as storage from '@/server/storage';
import { logger } from '@/utils/logger';

/**
 * POST /api/admin/force-cleanup — remove orphaned scratch data: job work directories
 * older than 6 hours and restore uploads older than 24 hours (normally removed by the job).
 */
export default createApiHandler({
    POST: route({
        auth: 'admin',
        handler: async (_req, _res, { user }) => {
            const foldersDeleted = await storage.purgeOlderThan(['jobs'], 6 * 60 * 60 * 1000);
            let filesDeleted = 0;
            const { readdir } = await import('fs/promises');
            const users = await readdir(storage.storagePath('uploads')).catch(() => [] as string[]);
            for (const u of users) filesDeleted += await storage.purgeOlderThan(['uploads', u], 24 * 60 * 60 * 1000);

            await logger.info('ADMIN_FORCE_CLEANUP', `Removed ${foldersDeleted} job folders and ${filesDeleted} stale uploads`, { foldersDeleted, filesDeleted }, user);
            return {
                message: `Cleanup complete. Removed ${foldersDeleted} job folders and ${filesDeleted} stale uploads.`,
                stats: { foldersDeleted, filesDeleted },
            };
        },
    }),
});
