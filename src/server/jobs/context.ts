import { getRedis } from '@/server/redis';
import { appendEvent } from './events';

const memoryCancelled = new Set<string>();
const cancelKey = (jobId: string) => `job:cancel:${jobId}`;

export async function requestCancel(jobId: string): Promise<void> {
    const redis = getRedis();
    if (redis) await redis.set(cancelKey(jobId), '1', 'EX', 24 * 60 * 60);
    else memoryCancelled.add(jobId);
}

async function isCancelRequested(jobId: string): Promise<boolean> {
    const redis = getRedis();
    if (redis) return (await redis.exists(cancelKey(jobId))) === 1;
    return memoryCancelled.has(jobId);
}

export class JobCancelledError extends Error {
    constructor() {
        super('Cancelled by user');
        this.name = 'JobCancelledError';
    }
}

const LOG_TAIL = 500;

/**
 * Passed to every job handler. `emit` sends a payload verbatim to connected clients
 * (keeping the wire format the UI already understands); `log` is a convenience for
 * plain progress lines. Handlers call `throwIfCancelled()` between units of work.
 */
export class JobContext<TParams = unknown> {
    readonly logTail: string[] = [];
    private lastCancelCheck = 0;
    private cancelled = false;

    constructor(
        readonly jobId: string,
        readonly userId: string,
        readonly params: TParams,
        private readonly formatLog: (message: string, level: 'info' | 'error' | 'success') => unknown = (message, level) => ({ type: 'log', level, payload: message })
    ) {}

    async emit(payload: unknown): Promise<void> {
        await appendEvent(this.jobId, 'data', payload);
    }

    async log(message: string, level: 'info' | 'error' | 'success' = 'info'): Promise<void> {
        this.logTail.push(`[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`);
        if (this.logTail.length > LOG_TAIL) this.logTail.shift();
        await this.emit(this.formatLog(message, level));
    }

    async throwIfCancelled(): Promise<void> {
        if (this.cancelled) throw new JobCancelledError();
        const now = Date.now();
        if (now - this.lastCancelCheck < 1000) return;
        this.lastCancelCheck = now;
        if (await isCancelRequested(this.jobId)) {
            this.cancelled = true;
            throw new JobCancelledError();
        }
    }
}
