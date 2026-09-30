import { createApiHandler, route } from '@/server/api';
import { enqueueJob } from '@/server/jobs/queue';
import { streamJob } from '@/server/jobs/sse';

export const config = { api: { responseLimit: false } };

/**
 * POST /api/smart-migrate/live-migrate-stream
 * Starts a Smart Migration as a background job and streams its progress (SSE).
 */
export default createApiHandler({
    POST: route({
        rateLimit: { limit: 10, windowSeconds: 60, bucket: 'jobs' },
        handler: async (req, res, { user, body }) => {
            const jobId = await enqueueJob(user.id, 'live-migrate', body);
            await streamJob(req, res, jobId);
        },
    }),
});
