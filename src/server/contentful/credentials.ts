import type { TokenKind } from '@prisma/client';
import { prisma } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/encryption';
import { HttpError } from '@/server/http-error';

const CMA_BASE = 'https://api.contentful.com';

export interface ContentfulProfile {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
}

/** AAD binds each encrypted token to its owner. */
export const tokenAad = (userId: string) => `token:${userId}`;

export function encryptToken(userId: string, token: string): string {
    return encrypt(token, tokenAad(userId));
}

export function decryptToken(userId: string, stored: string): string {
    return decrypt(stored, tokenAad(userId));
}

/**
 * Validate a Contentful access token by calling GET /users/me.
 * Throws HttpError(401) when Contentful rejects it.
 */
export async function fetchContentfulProfile(token: string): Promise<ContentfulProfile> {
    if (!/^[A-Za-z0-9_\-.]{20,200}$/.test(token)) {
        throw new HttpError(400, 'INVALID_TOKEN', 'This does not look like a Contentful access token');
    }
    const res = await fetch(`${CMA_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/vnd.contentful.management.v1+json' },
        signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 401 || res.status === 403) {
        throw new HttpError(401, 'TOKEN_REJECTED', 'Contentful rejected this access token');
    }
    if (!res.ok) {
        throw new HttpError(502, 'CONTENTFUL_UNAVAILABLE', `Contentful responded with ${res.status}`);
    }
    const body = (await res.json()) as {
        sys?: { id?: string };
        email?: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
    };
    if (!body.sys?.id || !body.email) {
        throw new HttpError(502, 'CONTENTFUL_UNAVAILABLE', 'Unexpected response from Contentful');
    }
    return {
        id: body.sys.id,
        email: body.email.toLowerCase(),
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        avatarUrl: body.avatarUrl ?? null,
    };
}

/** Store a token and make it the active one for the user. */
export async function saveActiveToken(userId: string, token: string, kind: TokenKind, alias: string): Promise<void> {
    const encrypted = encryptToken(userId, token);
    await prisma.$transaction(async (tx) => {
        await tx.contentfulToken.updateMany({ where: { userId }, data: { isActive: false } });
        if (kind === 'OAUTH') {
            // Only one OAuth credential per user: refresh it instead of piling up rows.
            const existing = await tx.contentfulToken.findFirst({ where: { userId, kind: 'OAUTH' } });
            if (existing) {
                await tx.contentfulToken.update({ where: { id: existing.id }, data: { token: encrypted, isActive: true, alias } });
                return;
            }
        }
        await tx.contentfulToken.create({ data: { userId, token: encrypted, kind, alias, isActive: true } });
    });
}

/**
 * Decrypted Contentful token for the user's active connection.
 * Throws HttpError(400) when the user has not connected Contentful.
 */
export async function getActiveToken(userId: string): Promise<string> {
    const token = await findActiveToken(userId);
    if (!token) {
        throw new HttpError(400, 'CONTENTFUL_NOT_CONNECTED', 'Connect a Contentful account in your profile first');
    }
    return token;
}

export async function findActiveToken(userId: string): Promise<string | null> {
    const row = await prisma.contentfulToken.findFirst({
        where: { userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, token: true, lastUsedAt: true },
    });
    if (!row) return null;
    if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60 * 60 * 1000) {
        prisma.contentfulToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
    }
    return decryptToken(userId, row.token);
}

export async function hasActiveToken(userId: string): Promise<boolean> {
    return (await prisma.contentfulToken.count({ where: { userId, isActive: true } })) > 0;
}
