import { getRedis } from '@/server/redis';

const memoryLocks = new Map<string, string>();
const LOCK_TTL_SECONDS = 12 * 60 * 60;

/** Exclusive lock (e.g. one mutating job per target environment). Returns false when taken. */
export async function acquireLock(key: string, owner: string): Promise<boolean> {
    const redis = getRedis();
    if (redis) return (await redis.set(`lock:${key}`, owner, 'EX', LOCK_TTL_SECONDS, 'NX')) === 'OK';
    if (memoryLocks.has(key)) return false;
    memoryLocks.set(key, owner);
    return true;
}

export async function releaseLock(key: string, owner: string): Promise<void> {
    const redis = getRedis();
    if (redis) {
        // Delete only if we still own it
        await redis.eval(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            1,
            `lock:${key}`,
            owner
        );
        return;
    }
    if (memoryLocks.get(key) === owner) memoryLocks.delete(key);
}
