import { encrypt, decrypt } from '@/lib/encryption';

describe('Encryption', () => {
    describe('encrypt', () => {
        it('should encrypt a string', () => {
            const text = 'Hello World';
            const encrypted = encrypt(text);

            expect(encrypted).toBeTruthy();
            expect(encrypted).not.toBe(text);
            expect(encrypted).toContain(':'); // IV:encrypted format
        });

        it('should return empty string for empty input', () => {
            expect(encrypt('')).toBe('');
        });

        it('should encrypt special characters', () => {
            const text = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
            const encrypted = encrypt(text);

            expect(encrypted).toBeTruthy();
            expect(encrypted).not.toBe(text);
        });

        it('should encrypt unicode characters', () => {
            const text = '你好世界 🌍 Привет мир';
            const encrypted = encrypt(text);

            expect(encrypted).toBeTruthy();
            expect(encrypted).not.toBe(text);
        });

        it('should produce different outputs for same input (random IV)', () => {
            const text = 'Same text';
            const encrypted1 = encrypt(text);
            const encrypted2 = encrypt(text);

            expect(encrypted1).not.toBe(encrypted2);
        });
    });

    describe('decrypt', () => {
        it('should decrypt an encrypted string', () => {
            const original = 'Hello World';
            const encrypted = encrypt(original);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(original);
        });

        it('should return empty string for empty input', () => {
            expect(decrypt('')).toBe('');
        });

        it('should decrypt special characters', () => {
            const original = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
            const encrypted = encrypt(original);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(original);
        });

        it('should decrypt unicode characters', () => {
            const original = '你好世界 🌍 Привет мир';
            const encrypted = encrypt(original);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(original);
        });

        it('should throw error for invalid format', () => {
            // crypto will throw error for invalid IV format
            expect(() => decrypt('invalid')).toThrow();
        });

        it('should handle long strings', () => {
            const original = 'A'.repeat(10000);
            const encrypted = encrypt(original);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(original);
        });
    });

    describe('encrypt/decrypt round-trip', () => {
        it('should handle multiple encryptions and decryptions', () => {
            const original = 'Test message';

            const encrypted1 = encrypt(original);
            const decrypted1 = decrypt(encrypted1);
            expect(decrypted1).toBe(original);

            const encrypted2 = encrypt(decrypted1);
            const decrypted2 = decrypt(encrypted2);
            expect(decrypted2).toBe(original);
        });

        it('should handle JSON strings', () => {
            const original = JSON.stringify({ key: 'value', nested: { data: 123 } });
            const encrypted = encrypt(original);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(original);
            expect(JSON.parse(decrypted)).toEqual(JSON.parse(original));
        });
    });
});
