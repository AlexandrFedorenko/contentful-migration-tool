import { createApiHandler, route } from '@/server/api';
import { enqueueJob } from '@/server/jobs/queue';
import { streamJob } from '@/server/jobs/sse';

export const config = { api: { responseLimit: false } };

/**
 * POST /api/visual-migrate { spaceId, environmentId, steps }
 * Validates Visual Builder steps against the server allow-list, runs them as a
 * background job and streams progress (SSE).
 */
export default createApiHandler({
    POST: route({
        rateLimit: { limit: 10, windowSeconds: 60, bucket: 'jobs' },
        handler: async (req, res, { user, body }) => {
            const jobId = await enqueueJob(user.id, 'visual-migration', body);
            await streamJob(req, res, jobId);
        },
    }),
});
