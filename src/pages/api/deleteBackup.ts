import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { notFound } from '@/server/http-error';
import { BackupService } from '@/utils/backup-service';
import { logger } from '@/utils/logger';

/** POST /api/deleteBackup { backupId } — delete one of the user's backups and its files. */
export default createApiHandler({
    POST: route({
        body: z.object({ backupId: z.string().uuid() }).passthrough(),
        handler: async (_req, _res, { user, body }) => {
            if (!(await BackupService.deleteBackup(body.backupId, user.id))) throw notFound('Backup');
            await logger.info('BACKUP_DELETE', 'Backup deleted', { backupId: body.backupId }, user);
            return null;
        },
    }),
});
