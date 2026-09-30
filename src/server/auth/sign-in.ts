import type { NextApiRequest, NextApiResponse } from 'next';
import type { TokenKind } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getEnv } from '@/server/env';
import { HttpError } from '@/server/http-error';
import { fetchContentfulProfile, saveActiveToken } from '@/server/contentful/credentials';
import { createSession, clientIp } from '@/server/auth/session';
import { logger } from '@/utils/logger';

/**
 * Sign a user in with a Contentful access token (from OAuth or a personal access token):
 * verify it with Contentful, upsert the local user, store the token encrypted and
 * start a session. The token never goes back to the browser.
 */
export async function signInWithContentfulToken(
    req: NextApiRequest,
    res: NextApiResponse,
    token: string,
    kind: TokenKind
): Promise<{ userId: string; isNewUser: boolean }> {
    const profile = await fetchContentfulProfile(token);
    const env = getEnv();
    const isBootstrapAdmin = env.BOOTSTRAP_ADMIN_EMAILS.includes(profile.email);

    const profileData = {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
        lastLoginAt: new Date(),
        ...(isBootstrapAdmin ? { role: 'ADMIN' as const } : {}),
    };

    let isNewUser = false;
    const user = await prisma.$transaction(async (tx) => {
        const byContentfulId = await tx.user.findUnique({ where: { contentfulUserId: profile.id } });
        if (byContentfulId) {
            // Email may have changed in Contentful; avoid clashing with another local row.
            const clash = await tx.user.findFirst({ where: { email: profile.email, NOT: { id: byContentfulId.id } } });
            return tx.user.update({
                where: { id: byContentfulId.id },
                data: clash ? { ...profileData, email: byContentfulId.email } : profileData,
            });
        }
        // Accounts created before Contentful sign-in (Clerk era) are linked by verified email.
        const byEmail = await tx.user.findUnique({ where: { email: profile.email } });
        if (byEmail) {
            if (byEmail.contentfulUserId && byEmail.contentfulUserId !== profile.id) {
                throw new HttpError(409, 'ACCOUNT_CONFLICT', 'This email is linked to a different Contentful account');
            }
            return tx.user.update({ where: { id: byEmail.id }, data: { ...profileData, contentfulUserId: profile.id } });
        }
        isNewUser = true;
        return tx.user.create({ data: { ...profileData, contentfulUserId: profile.id } });
    });

    if (user.suspendedAt) {
        throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended. Contact the administrator.');
    }

    await saveActiveToken(user.id, token, kind, kind === 'OAUTH' ? 'Contentful (OAuth)' : 'Personal access token');
    await createSession(res, req, user.id);

    await logger.info(
        'AUTH_SIGN_IN',
        `Signed in via ${kind === 'OAUTH' ? 'Contentful OAuth' : 'access token'}`,
        { method: kind, isNewUser, ip: clientIp(req) },
        { id: user.id, email: user.email }
    );

    return { userId: user.id, isNewUser };
}
