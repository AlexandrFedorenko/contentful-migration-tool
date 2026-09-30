import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { getActiveToken } from '@/server/contentful/credentials';
import { environmentId, spaceId } from '@/server/validation';
import { ContentfulManagement } from '@/utils/contentful-management';

/** POST /api/get-views — saved entry/asset list views of an environment. */
export default createApiHandler({
    POST: route({
        body: z.object({ spaceId, environmentId }),
        rateLimit: { limit: 60, windowSeconds: 60 },
        handler: async (_req, _res, { user, body }) => {
            const token = await getActiveToken(user.id);
            const space = await ContentfulManagement.getClient(token).getSpace(body.spaceId);
            const environment = await space.getEnvironment(body.environmentId);
            const uiConfig = await environment.getUIConfig();
            return {
                entryListViews: uiConfig.entryListViews || [],
                assetListViews: uiConfig.assetListViews || [],
                version: uiConfig.sys.version,
            };
        },
    }),
});
