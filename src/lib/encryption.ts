import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.CLERK_SECRET_KEY || 'default_secret_key_must_be_32_bytes_long!'; // Fallback for dev only
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

// The actual key used for encryption/decryption, derived from ENCRYPTION_KEY
const CIPHER_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

export function encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cipher = crypto.createCipheriv(ALGORITHM, CIPHER_KEY as any, iv as any);
    let encrypted = cipher.update(text);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    encrypted = Buffer.concat([encrypted, cipher.final() as any]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    if (!text) return '';
    const textParts = text.split(':');
    const ivPart = textParts.shift();
    if (!ivPart) throw new Error('Invalid encrypted text format');

    const iv = Buffer.from(ivPart, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decipher = crypto.createDecipheriv(ALGORITHM, CIPHER_KEY as any, iv as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let decrypted = decipher.update(encryptedText as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    decrypted = Buffer.concat([decrypted as any, decipher.final() as any]);
    return decrypted.toString();
}
