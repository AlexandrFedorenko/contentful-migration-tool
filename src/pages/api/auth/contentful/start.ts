import type { NextApiRequest, NextApiResponse } from 'next';
import { randomToken } from '@/lib/encryption';
import { getEnv } from '@/server/env';
import { OAUTH_STATE_COOKIE, appendSetCookie, serializeCookie } from '@/server/auth/session';

export const CONTENTFUL_AUTHORIZE_URL = 'https://be.contentful.com/oauth/authorize';

/**
 * GET /api/auth/contentful/start
 * Starts the Contentful OAuth flow: remembers a random `state` in a short-lived
 * HttpOnly cookie and redirects the browser to Contentful's consent screen.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end();
    }
    const env = getEnv();
    if (!env.CONTENTFUL_OAUTH_CLIENT_ID) {
        return res.redirect(302, '/sign-in?error=oauth_not_configured');
    }

    const state = randomToken(24);
    const returnTo = typeof req.query.returnTo === 'string' && /^\/(?!\/)[\w\-/?=&.%]*$/.test(req.query.returnTo)
        ? req.query.returnTo
        : '/';
    appendSetCookie(res, serializeCookie(OAUTH_STATE_COOKIE, `${state}|${returnTo}`, { maxAgeSeconds: 600 }));

    const url = new URL(CONTENTFUL_AUTHORIZE_URL);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('client_id', env.CONTENTFUL_OAUTH_CLIENT_ID);
    url.searchParams.set('redirect_uri', `${env.APP_URL}/auth/callback`);
    url.searchParams.set('scope', 'content_management_manage');
    url.searchParams.set('state', state);

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, url.toString());
}
