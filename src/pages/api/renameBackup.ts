import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { safeFileName, spaceId } from '@/server/validation';
import { BackupService } from '@/utils/backup-service';

/** POST /api/renameBackup { spaceId, oldFileName, newFileName } */
export default createApiHandler({
    POST: route({
        body: z.object({ spaceId, oldFileName: z.string().min(1).max(300), newFileName: safeFileName }),
        handler: async (_req, _res, { user, body }) => {
            const newFileName = body.newFileName.endsWith('.json') ? body.newFileName : `${body.newFileName}.json`;
            await BackupService.renameBackup(body.spaceId, user.id, body.oldFileName, newFileName);
            return { newFileName };
        },
    }),
});
