import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { safeEqual } from '@/lib/encryption';
import { HttpError } from '@/server/http-error';
import { OAUTH_STATE_COOKIE, appendSetCookie, parseCookies, serializeCookie } from '@/server/auth/session';
import { signInWithContentfulToken } from '@/server/auth/sign-in';

const Body = z.object({
    accessToken: z.string().min(20).max(200),
    state: z.string().min(16).max(100),
});

/**
 * POST /api/auth/contentful/complete
 * Called by the /auth/callback page with the token taken from the URL fragment.
 * Verifies `state` against the cookie set by /start, then signs the user in.
 */
export default createApiHandler({
    POST: route({
        auth: 'public',
        body: Body,
        rateLimit: { limit: 20, windowSeconds: 60, bucket: 'auth' },
        handler: async (req, res, { body }) => {
            const [expectedState, returnTo = '/'] = (parseCookies(req)[OAUTH_STATE_COOKIE] || '').split('|');
            appendSetCookie(res, serializeCookie(OAUTH_STATE_COOKIE, '', { maxAgeSeconds: 0 }));
            if (!expectedState || !safeEqual(expectedState, body.state)) {
                throw new HttpError(400, 'INVALID_STATE', 'Sign-in session expired. Please try again.');
            }
            const { isNewUser } = await signInWithContentfulToken(req, res, body.accessToken, 'OAUTH');
            return { redirectTo: returnTo, isNewUser };
        },
    }),
});
