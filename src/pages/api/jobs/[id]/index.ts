import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { getJobForUser } from '@/server/jobs/queue';

/** GET /api/jobs/:id — status, result and log tail of one of the user's jobs. */
export default createApiHandler({
    GET: route({
        query: z.object({ id: z.string().uuid() }),
        handler: async (_req, _res, { user, query }) => getJobForUser(query.id, user.id),
    }),
});
