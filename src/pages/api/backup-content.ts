import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { spaceId } from '@/server/validation';
import { BackupService } from '@/utils/backup-service';

export const config = { api: { responseLimit: false } };

/** GET /api/backup-content?spaceId=&filename= — backup JSON for the preview page (own backups only). */
export default createApiHandler({
    GET: route({
        query: z.object({ spaceId, filename: z.string().min(1).max(300) }),
        rateLimit: { limit: 30, windowSeconds: 60 },
        handler: async (_req, _res, { user, query }) => BackupService.getBackupContentByName(query.spaceId, query.filename, user.id),
    }),
});
