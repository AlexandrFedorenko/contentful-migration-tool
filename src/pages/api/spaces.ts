import { createApiHandler, route } from '@/server/api';
import { getActiveToken } from '@/server/contentful/credentials';
import { ContentfulManagement } from '@/utils/contentful-management';

/** GET /api/spaces — spaces the connected Contentful account can access (US, then EU data residency). */
export default createApiHandler({
    GET: route({
        rateLimit: { limit: 60, windowSeconds: 60 },
        handler: async (_req, _res, { user }) => {
            const token = await getActiveToken(user.id);
            let spaces: Awaited<ReturnType<typeof ContentfulManagement.getSpaces>> = [];
            let firstError: unknown = null;
            try {
                spaces = await ContentfulManagement.getSpaces(token);
            } catch (error) {
                firstError = error;
            }
            if (spaces.length === 0) {
                try {
                    spaces = await ContentfulManagement.getSpaces(token, 'api.eu.contentful.com');
                } catch {
                    if (firstError) throw firstError;
                }
            }
            return { spaces: spaces.map((s) => ({ id: s.id, name: s.name })) };
        },
    }),
});
