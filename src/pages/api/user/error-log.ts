import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { deleteLegacyLogFile, readLegacyLogFile } from '@/server/legacy-log-files';

const Query = z.object({ file: z.string().min(1).max(500) });

/** Legacy CLI error log files that belong to the current user's log entries. */
export default createApiHandler({
    GET: route({
        query: Query,
        handler: async (_req, _res, { user, query }) => ({ content: await readLegacyLogFile(query.file, user.id) }),
    }),
    DELETE: route({
        query: Query,
        handler: async (_req, _res, { user, query }) => {
            await deleteLegacyLogFile(query.file, user.id);
            return { message: 'Log file deleted' };
        },
    }),
});
