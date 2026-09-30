import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { deleteLegacyLogFile, readLegacyLogFile } from '@/server/legacy-log-files';

const Query = z.object({ file: z.string().min(1).max(500) });

/** Legacy CLI error log files (admin). */
export default createApiHandler({
    GET: route({
        auth: 'admin',
        query: Query,
        handler: async (_req, _res, { query }) => ({ content: await readLegacyLogFile(query.file) }),
    }),
    DELETE: route({
        auth: 'admin',
        query: Query,
        handler: async (_req, _res, { query }) => {
            await deleteLegacyLogFile(query.file);
            return { message: 'Log file deleted' };
        },
    }),
});
