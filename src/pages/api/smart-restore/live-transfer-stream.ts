import { createApiHandler, route } from '@/server/api';
import { enqueueJob } from '@/server/jobs/queue';
import { streamJob } from '@/server/jobs/sse';

export const config = { api: { responseLimit: false } };

/**
 * POST /api/smart-restore/live-transfer-stream
 * Starts a live CMA transfer as a background job and streams its progress (SSE).
 * A safety backup of the target is taken first. The job continues if the browser
 * disconnects; reconnect via GET /api/jobs/:id/events (id in the X-Job-Id header).
 */
export default createApiHandler({
    POST: route({
        rateLimit: { limit: 10, windowSeconds: 60, bucket: 'jobs' },
        handler: async (req, res, { user, body }) => {
            const jobId = await enqueueJob(user.id, 'live-transfer', body);
            await streamJob(req, res, jobId);
        },
    }),
});
