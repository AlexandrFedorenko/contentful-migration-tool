import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { cancelJob } from '@/server/jobs/queue';

/** POST /api/jobs/:id/cancel — request cancellation; the worker stops at the next safe point. */
export default createApiHandler({
    POST: route({
        query: z.object({ id: z.string().uuid() }),
        handler: async (_req, _res, { user, query }) => {
            await cancelJob(query.id, user.id);
            return { cancelled: true };
        },
    }),
});
