import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { getJobForUser } from '@/server/jobs/queue';
import { streamJob } from '@/server/jobs/sse';

export const config = { api: { responseLimit: false } };

const EVENT_ID = /^\d{1,20}-\d{1,10}$/;

/** GET /api/jobs/:id/events — live progress (SSE). Supports Last-Event-ID / ?after= to resume. */
export default createApiHandler({
    GET: route({
        query: z.object({ id: z.string().uuid(), after: z.string().regex(EVENT_ID).optional() }),
        rateLimit: { limit: 120, windowSeconds: 60 },
        handler: async (req, res, { user, query }) => {
            await getJobForUser(query.id, user.id);
            const header = req.headers['last-event-id'];
            const lastId = typeof header === 'string' && EVENT_ID.test(header) ? header : query.after;
            await streamJob(req, res, query.id, lastId);
        },
    }),
});
