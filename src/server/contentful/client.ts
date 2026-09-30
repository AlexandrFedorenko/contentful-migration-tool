import axios, { type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { createClient, type ClientAPI } from 'contentful-management';
import { createHash } from 'crypto';
import { getEnv } from '@/server/env';
import { getRedis } from '@/server/redis';

/**
 * Contentful Management API client with a rate limiter shared by every web and
 * worker process (via Redis). Contentful enforces its CMA limit per organization,
 * so N users migrating the same space in parallel must share one budget instead of
 * each hammering the API and bouncing off 429s.
 *
 * The bucket key is the space id from the request path (a space belongs to exactly
 * one organization); requests without a space (e.g. GET /spaces) use a per-token bucket.
 * On top of that the SDK retries 429/5xx with backoff (retryOnError).
 */

const defaultAdapter = axios.getAdapter('http') as AxiosAdapter;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const localWindows = new Map<string, { second: number; count: number }>();

async function acquireSlot(bucket: string): Promise<void> {
    const limit = getEnv().CMA_RATE_LIMIT_RPS;
    const redis = getRedis();

    for (let attempt = 0; attempt < 600; attempt++) {
        const now = Date.now();
        const second = Math.floor(now / 1000);
        let count: number;

        if (redis) {
            const key = `cma:rl:${bucket}:${second}`;
            const res = await redis.multi().incr(key).expire(key, 2).exec();
            count = Number(res?.[0]?.[1] ?? 0);
        } else {
            const w = localWindows.get(bucket);
            if (!w || w.second !== second) {
                localWindows.set(bucket, { second, count: 1 });
                count = 1;
            } else {
                count = ++w.count;
            }
        }

        if (count <= limit) return;
        // Wait for the next one-second window, with jitter to avoid thundering herds.
        await sleep(1000 - (now % 1000) + Math.floor(Math.random() * 50));
    }
    throw new Error('Timed out waiting for Contentful rate limit slot');
}

function bucketFor(config: InternalAxiosRequestConfig, tokenHash: string): string {
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
    const match = url.match(/\/spaces\/([a-zA-Z0-9]+)/);
    return match ? `space:${match[1]}` : `token:${tokenHash}`;
}

export function createCmaClient(token: string, opts: { host?: string } = {}): ClientAPI {
    if (!token) throw new Error('Contentful Management Token required');
    const tokenHash = createHash('sha256').update(token).digest('hex').slice(0, 16);

    const adapter: AxiosAdapter = async (config) => {
        await acquireSlot(bucketFor(config, tokenHash));
        return defaultAdapter(config);
    };

    return createClient({
        accessToken: token,
        host: opts.host || 'api.contentful.com',
        application: 'contentful-migration-tool/1.0',
        retryOnError: true,
        retryLimit: 6,
        timeout: 60_000,
        adapter,
        // Do not leak request details (they include the Authorization header) to stdout.
        logHandler: (level, data) => {
            if (level === 'error' || level === 'warning') {
                const msg = typeof data === 'string' ? data : (data as Error)?.message;
                console.warn(`[cma] ${level}: ${msg}`);
            }
        },
    });
}
