import { createApiHandler, route } from '@/server/api';
import { getEnv } from '@/server/env';
import { getSessionUser } from '@/server/auth/session';
import { hasActiveToken } from '@/server/contentful/credentials';

/**
 * GET /api/auth/me — current user (or null) plus the sign-in methods this deployment offers.
 * Public so the sign-in page can render without a session.
 */
export default createApiHandler({
    GET: route({
        auth: 'public',
        handler: async (req, res) => {
            res.setHeader('Cache-Control', 'no-store');
            const env = getEnv();
            const user = await getSessionUser(req);
            return {
                user: user && {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                    hasContentfulToken: await hasActiveToken(user.id),
                },
                methods: {
                    oauth: Boolean(env.CONTENTFUL_OAUTH_CLIENT_ID),
                    token: env.ALLOW_TOKEN_LOGIN,
                },
            };
        },
    }),
});
