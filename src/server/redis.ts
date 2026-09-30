import IORedis, { type Redis } from 'ioredis';
import { getEnv } from './env';

const globalForRedis = globalThis as unknown as { __redis?: Redis | null };

/**
 * Shared Redis connection, or null when REDIS_URL is not configured
 * (allowed in development and tests; production requires it).
 */
export function getRedis(): Redis | null {
    if (globalForRedis.__redis !== undefined) return globalForRedis.__redis;
    const url = getEnv().REDIS_URL;
    globalForRedis.__redis = url
        ? new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: true, lazyConnect: false })
        : null;
    return globalForRedis.__redis;
}

/** A new dedicated connection (required for SUBSCRIBE and for BullMQ workers). */
export function createRedisConnection(): Redis {
    const url = getEnv().REDIS_URL;
    if (!url) throw new Error('REDIS_URL is not configured');
    return new IORedis(url, { maxRetriesPerRequest: null });
}
