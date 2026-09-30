/**
 * @jest-environment node
 */
import crypto from 'crypto';
import { encrypt, decrypt, needsReencryption, safeEqual } from '@/lib/encryption';
import { resetEnvCache } from '@/server/env';

const KEY_A = crypto.randomBytes(32).toString('base64');
const KEY_B = crypto.randomBytes(32).toString('base64');

function setKeys(current: string, previous?: string, legacy?: string) {
    process.env.ENCRYPTION_KEY = current;
    if (previous) process.env.ENCRYPTION_KEY_PREVIOUS = previous; else delete process.env.ENCRYPTION_KEY_PREVIOUS;
    if (legacy) process.env.LEGACY_ENCRYPTION_SECRET = legacy; else delete process.env.LEGACY_ENCRYPTION_SECRET;
    resetEnvCache();
}

describe('encryption', () => {
    beforeEach(() => setKeys(KEY_A));

    it('round-trips unicode and special characters', () => {
        for (const text of ['Hello', '你好世界 🌍 Привет', '!@#$%^&*():.;\'"', 'x'.repeat(10_000)]) {
            expect(decrypt(encrypt(text))).toBe(text);
        }
    });

    it('uses the v2 format with a random IV', () => {
        const a = encrypt('same');
        const b = encrypt('same');
        expect(a).toMatch(/^v2\.[0-9a-f]{8}\./);
        expect(a).not.toBe(b);
    });

    it('returns empty string for empty input', () => {
        expect(encrypt('')).toBe('');
        expect(decrypt('')).toBe('');
    });

    it('rejects tampered ciphertext', () => {
        const parts = encrypt('secret-token').split('.');
        const ct = Buffer.from(parts[4], 'base64url');
        ct[0] ^= 1;
        parts[4] = ct.toString('base64url');
        expect(() => decrypt(parts.join('.'))).toThrow();
    });

    it('binds ciphertext to AAD', () => {
        const enc = encrypt('secret', 'token:user-1');
        expect(decrypt(enc, 'token:user-1')).toBe('secret');
        expect(() => decrypt(enc, 'token:user-2')).toThrow();
    });

    it('decrypts with the previous key during rotation and flags re-encryption', () => {
        const old = encrypt('rotating');
        setKeys(KEY_B, KEY_A);
        expect(decrypt(old)).toBe('rotating');
        expect(needsReencryption(old)).toBe(true);
        expect(needsReencryption(encrypt('fresh'))).toBe(false);
    });

    it('fails when the key is unknown', () => {
        const old = encrypt('lost');
        setKeys(KEY_B);
        expect(() => decrypt(old)).toThrow(/not configured/);
    });

    it('reads legacy AES-CBC values', () => {
        const legacySecret = 'sk_test_legacy';
        const key = crypto.createHash('sha256').update(legacySecret).digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        const legacy = iv.toString('hex') + ':' + Buffer.concat([cipher.update('old-token'), cipher.final()]).toString('hex');

        setKeys(KEY_A, undefined, legacySecret);
        expect(decrypt(legacy)).toBe('old-token');
        expect(needsReencryption(legacy)).toBe(true);
    });

    it('rejects an invalid key length', () => {
        process.env.ENCRYPTION_KEY = Buffer.from('short').toString('base64');
        resetEnvCache();
        expect(() => encrypt('x')).toThrow(/ENCRYPTION_KEY/);
    });

    it('compares strings in constant time', () => {
        expect(safeEqual('abc', 'abc')).toBe(true);
        expect(safeEqual('abc', 'abd')).toBe(false);
        expect(safeEqual('abc', 'abcd')).toBe(false);
    });
});
