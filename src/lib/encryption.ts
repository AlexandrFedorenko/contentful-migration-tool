import crypto from 'crypto';
import { getEnv } from '@/server/env';

/**
 * Authenticated encryption for secrets at rest (Contentful access tokens).
 *
 * Format v2:  v2.<kid>.<iv>.<tag>.<ciphertext>   (base64url parts)
 *   - AES-256-GCM, 96-bit random IV, 128-bit tag
 *   - kid = first 8 hex chars of sha256(key); lets us keep an old key during rotation
 *   - optional AAD binds a ciphertext to its owner (e.g. `token:<userId>`), so a row
 *     copied to another user fails to decrypt
 *
 * Legacy format (read-only): <iv hex>:<ciphertext hex>, AES-256-CBC with
 * key = sha256(LEGACY_ENCRYPTION_SECRET). Rewritten to v2 by `npm run secrets:rotate`.
 */

const VERSION = 'v2';
const IV_LENGTH = 12;

interface Key { kid: string; key: Buffer }

function toKey(b64: string): Key {
    const key = Buffer.from(b64, 'base64');
    const kid = crypto.createHash('sha256').update(key).digest('hex').slice(0, 8);
    return { kid, key };
}

function keyring(): { current: Key; all: Map<string, Key> } {
    const env = getEnv();
    const current = toKey(env.ENCRYPTION_KEY);
    const all = new Map<string, Key>([[current.kid, current]]);
    if (env.ENCRYPTION_KEY_PREVIOUS) {
        const prev = toKey(env.ENCRYPTION_KEY_PREVIOUS);
        all.set(prev.kid, prev);
    }
    return { current, all };
}

export function encrypt(plaintext: string, aad?: string): string {
    if (!plaintext) return '';
    const { current } = keyring();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', current.key, iv);
    if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, current.kid, iv.toString('base64url'), tag.toString('base64url'), ct.toString('base64url')].join('.');
}

export function decrypt(payload: string, aad?: string): string {
    if (!payload) return '';
    if (payload.startsWith(`${VERSION}.`)) {
        const [, kid, ivB64, tagB64, ctB64] = payload.split('.');
        const key = keyring().all.get(kid);
        if (!key) throw new Error('Encryption key for this secret is not configured');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key.key, Buffer.from(ivB64, 'base64url'));
        if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'));
        decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
        return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64url')), decipher.final()]).toString('utf8');
    }
    return decryptLegacy(payload);
}

/** True when the value was written with an older key or the legacy scheme and should be re-encrypted. */
export function needsReencryption(payload: string): boolean {
    if (!payload) return false;
    if (!payload.startsWith(`${VERSION}.`)) return true;
    return payload.split('.')[1] !== keyring().current.kid;
}

function decryptLegacy(payload: string): string {
    const secret = getEnv().LEGACY_ENCRYPTION_SECRET;
    if (!secret) throw new Error('Legacy encrypted secret found but LEGACY_ENCRYPTION_SECRET is not set');
    const [ivHex, ...rest] = payload.split(':');
    if (!ivHex || rest.length === 0) throw new Error('Invalid encrypted value');
    const key = crypto.createHash('sha256').update(secret).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(rest.join(':'), 'hex')), decipher.final()]).toString('utf8');
}

/** SHA-256 hex digest; used to store session identifiers without keeping the raw value. */
export function sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('base64url');
}

export function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
