import { z } from 'zod';

/**
 * Server-side environment configuration.
 *
 * Parsed lazily on first access so that `next build` and unit tests do not
 * require a full production environment, but any running server fails fast
 * with a readable message when something required is missing.
 */
const base64Key = z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, 'must be 32 bytes encoded as base64 (openssl rand -base64 32)');

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    /** Public origin of the app, e.g. https://migrate.example.com (no trailing slash). */
    APP_URL: z.string().url().transform((v) => v.replace(/\/+$/, '')).default('http://localhost:3000'),

    DATABASE_URL: z.string().min(1),
    /** Required in production: queues, rate limiting, pub/sub. */
    REDIS_URL: z.string().optional(),

    /** Current data-encryption key for secrets at rest (Contentful tokens). */
    ENCRYPTION_KEY: base64Key,
    /** Previous key, kept only while `npm run secrets:rotate` re-encrypts old rows. */
    ENCRYPTION_KEY_PREVIOUS: base64Key.optional(),
    /** Old CLERK_SECRET_KEY-derived secret; lets us read rows written by the legacy AES-CBC scheme. */
    LEGACY_ENCRYPTION_SECRET: z.string().optional(),

    /** Client ID of the OAuth application registered in Contentful. */
    CONTENTFUL_OAUTH_CLIENT_ID: z.string().optional(),
    /** Allow signing in with a Contentful personal access token (useful for self-hosting and CI). */
    ALLOW_TOKEN_LOGIN: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),

    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(14),
    /** Comma separated emails that become ADMIN on first sign-in. */
    BOOTSTRAP_ADMIN_EMAILS: z
        .string()
        .default('')
        .transform((v) => v.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)),

    /** Root directory for backups, asset archives and per-job scratch space. Shared by web and worker. */
    DATA_DIR: z.string().default('./data'),

    /** Number of reverse proxies in front of the app (Caddy = 1). Used to read the client IP. */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),

    /** Contentful Management API budget per Contentful organization, requests per second. */
    CMA_RATE_LIMIT_RPS: z.coerce.number().int().min(1).max(100).default(6),

    WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(32).default(4),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
    if (cached) return cached;
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
        const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
        throw new Error(`Invalid server environment configuration:\n${details}`);
    }
    const env = parsed.data;
    if (env.NODE_ENV === 'production') {
        if (!env.REDIS_URL) throw new Error('REDIS_URL is required in production');
        if (!env.APP_URL.startsWith('https://')) throw new Error('APP_URL must use https in production');
        if (!env.CONTENTFUL_OAUTH_CLIENT_ID && !env.ALLOW_TOKEN_LOGIN) {
            throw new Error('Enable at least one sign-in method: CONTENTFUL_OAUTH_CLIENT_ID or ALLOW_TOKEN_LOGIN=true');
        }
    }
    cached = env;
    return env;
}

/** Test helper: forget the parsed env so tests can change process.env. */
export function resetEnvCache(): void {
    cached = null;
}

export const isProduction = () => process.env.NODE_ENV === 'production';
