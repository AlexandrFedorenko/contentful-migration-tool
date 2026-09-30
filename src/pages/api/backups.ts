import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { spaceId } from '@/server/validation';
import { BackupService } from '@/utils/backup-service';

/** GET /api/backups?spaceId= — the current user's backups of a space. */
export default createApiHandler({
    GET: route({
        query: z.object({ spaceId }),
        handler: async (_req, _res, { user, query }) => ({ backups: await BackupService.getBackups(query.spaceId, user.id) }),
    }),
});
