import { getRedis } from './redis';

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetSeconds: number;
}

const memory = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window counter. Uses Redis when available so the limit is shared by all
 * app replicas; falls back to process memory in development.
 */
export async function hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const redis = getRedis();
    const fullKey = `rl:${key}`;

    if (redis) {
        const results = await redis.multi().incr(fullKey).ttl(fullKey).exec();
        const count = Number(results?.[0]?.[1] ?? 0);
        let ttl = Number(results?.[1]?.[1] ?? -1);
        if (ttl < 0) {
            await redis.expire(fullKey, windowSeconds);
            ttl = windowSeconds;
        }
        return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetSeconds: ttl };
    }

    const now = Date.now();
    const entry = memory.get(fullKey);
    if (!entry || entry.resetAt <= now) {
        memory.set(fullKey, { count: 1, resetAt: now + windowSeconds * 1000 });
        if (memory.size > 10_000) {
            for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
        }
        return { allowed: true, remaining: limit - 1, resetSeconds: windowSeconds };
    }
    entry.count += 1;
    return {
        allowed: entry.count <= limit,
        remaining: Math.max(0, limit - entry.count),
        resetSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
}
