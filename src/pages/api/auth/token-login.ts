import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { getEnv } from '@/server/env';
import { HttpError } from '@/server/http-error';
import { signInWithContentfulToken } from '@/server/auth/sign-in';

const Body = z.object({ token: z.string().trim().min(20).max(200) });

/**
 * POST /api/auth/token-login
 * Sign in with a Contentful personal access token (CFPAT-...). Useful when an
 * organization does not allow third-party OAuth apps, and for self-hosted setups.
 */
export default createApiHandler({
    POST: route({
        auth: 'public',
        body: Body,
        rateLimit: { limit: 10, windowSeconds: 60, bucket: 'auth' },
        handler: async (req, res, { body }) => {
            if (!getEnv().ALLOW_TOKEN_LOGIN) {
                throw new HttpError(403, 'TOKEN_LOGIN_DISABLED', 'Sign-in with an access token is disabled');
            }
            const { isNewUser } = await signInWithContentfulToken(req, res, body.token, 'PAT');
            return { redirectTo: '/', isNewUser };
        },
    }),
});
