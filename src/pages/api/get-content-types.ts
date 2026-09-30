import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { getActiveToken } from '@/server/contentful/credentials';
import { environmentId, spaceId } from '@/server/validation';
import { ContentfulManagement } from '@/utils/contentful-management';

/** POST /api/get-content-types — content types of an environment. */
export default createApiHandler({
    POST: route({
        body: z.object({ spaceId, environmentId }),
        rateLimit: { limit: 60, windowSeconds: 60 },
        handler: async (_req, _res, { user, body }) => {
            const token = await getActiveToken(user.id);
            return ContentfulManagement.getContentTypes(body.spaceId, body.environmentId, token);
        },
    }),
});
