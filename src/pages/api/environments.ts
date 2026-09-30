import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { getActiveToken } from '@/server/contentful/credentials';
import { spaceId } from '@/server/validation';
import { ContentfulManagement } from '@/utils/contentful-management';

/** GET /api/environments?spaceId= — environments of a space. */
export default createApiHandler({
    GET: route({
        query: z.object({ spaceId }),
        rateLimit: { limit: 120, windowSeconds: 60 },
        handler: async (_req, _res, { user, query }) => {
            const token = await getActiveToken(user.id);
            const environments = await ContentfulManagement.getEnvironments(query.spaceId, token);
            return {
                environments: environments.map((env) => ({ id: env.id, name: env.name, createdAt: env.createdAt })),
            };
        },
    }),
});
