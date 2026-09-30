import { EventEmitter } from 'events';
import { getRedis } from '@/server/redis';

/**
 * Job event log.
 *
 * With Redis: one Redis Stream per job (`job:events:<id>`). Every event gets a
 * monotonic id that doubles as the SSE `id:`, so a client can reconnect with
 * Last-Event-ID and resume without losing lines. Streams expire a day after the
 * job ends; the final status/result and a log tail are kept in Postgres.
 *
 * Without Redis (development, tests): the same API backed by process memory.
 */

export type JobEventKind = 'data' | 'end';

export interface JobEvent {
    id: string;
    kind: JobEventKind;
    payload: unknown;
}

export interface JobEndPayload {
    status: 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
    result?: unknown;
    error?: string;
}

const STREAM_TTL_SECONDS = 24 * 60 * 60;
const MAX_STREAM_LENGTH = 50_000;
const streamKey = (jobId: string) => `job:events:${jobId}`;

// ── In-memory fallback ────────────────────────────────────────────────────────
const memory = new Map<string, JobEvent[]>();
const bus = new EventEmitter();
bus.setMaxListeners(0);
let memorySeq = 0;

export async function appendEvent(jobId: string, kind: JobEventKind, payload: unknown): Promise<string> {
    const redis = getRedis();
    if (redis) {
        const key = streamKey(jobId);
        const id = await redis.xadd(key, 'MAXLEN', '~', String(MAX_STREAM_LENGTH), '*', 'k', kind, 'p', JSON.stringify(payload ?? null));
        if (kind === 'end') await redis.expire(key, STREAM_TTL_SECONDS);
        return id as string;
    }
    const event: JobEvent = { id: `${Date.now()}-${++memorySeq}`, kind, payload };
    const list = memory.get(jobId) ?? [];
    list.push(event);
    if (list.length > MAX_STREAM_LENGTH) list.shift();
    memory.set(jobId, list);
    bus.emit(jobId, event);
    if (kind === 'end') setTimeout(() => memory.delete(jobId), STREAM_TTL_SECONDS * 1000).unref?.();
    return event.id;
}

function compareIds(a: string, b: string): number {
    const [am, as] = a.split('-').map(Number);
    const [bm, bs] = b.split('-').map(Number);
    return am - bm || as - bs;
}

/** Events strictly after `afterId` (or from the beginning). */
export async function readEvents(jobId: string, afterId?: string, count = 500): Promise<JobEvent[]> {
    const redis = getRedis();
    if (redis) {
        const start = afterId ? `(${afterId}` : '-';
        const rows = await redis.xrange(streamKey(jobId), start, '+', 'COUNT', count);
        return rows.map(([id, fields]) => {
            const map: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) map[fields[i]] = fields[i + 1];
            return { id, kind: map.k as JobEventKind, payload: JSON.parse(map.p ?? 'null') };
        });
    }
    const list = memory.get(jobId) ?? [];
    return (afterId ? list.filter((e) => compareIds(e.id, afterId) > 0) : list).slice(0, count);
}

/**
 * Follow a job's events from `afterId` until the `end` event or until `signal` aborts.
 * Yields events in order, including the final `end` event.
 */
export async function* followEvents(jobId: string, afterId: string | undefined, signal: AbortSignal): AsyncGenerator<JobEvent> {
    let cursor = afterId;
    const redis = getRedis();

    if (!redis) {
        const queue: JobEvent[] = [];
        let wake: (() => void) | null = null;
        const onEvent = (e: JobEvent) => {
            queue.push(e);
            wake?.();
        };
        bus.on(jobId, onEvent);
        try {
            for (const e of await readEvents(jobId, cursor, Number.MAX_SAFE_INTEGER)) {
                cursor = e.id;
                yield e;
                if (e.kind === 'end') return;
            }
            while (!signal.aborted) {
                if (queue.length === 0) {
                    await new Promise<void>((resolve) => {
                        wake = resolve;
                        signal.addEventListener('abort', () => resolve(), { once: true });
                    });
                    wake = null;
                }
                while (queue.length) {
                    const e = queue.shift()!;
                    if (cursor && compareIds(e.id, cursor) <= 0) continue;
                    cursor = e.id;
                    yield e;
                    if (e.kind === 'end') return;
                }
            }
        } finally {
            bus.off(jobId, onEvent);
        }
        return;
    }

    // Redis: poll the stream. Cheap (one XRANGE per tick on a shared connection)
    // and avoids a dedicated blocking connection per connected browser.
    while (!signal.aborted) {
        const events = await readEvents(jobId, cursor);
        for (const e of events) {
            cursor = e.id;
            yield e;
            if (e.kind === 'end') return;
        }
        if (events.length === 0) await new Promise((r) => setTimeout(r, 400));
    }
}

/** Wait for the job to end and return its end payload. */
export async function waitForEnd(jobId: string, signal: AbortSignal): Promise<JobEndPayload | null> {
    for await (const e of followEvents(jobId, undefined, signal)) {
        if (e.kind === 'end') return e.payload as JobEndPayload;
    }
    return null;
}
