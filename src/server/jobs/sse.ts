import type { NextApiRequest, NextApiResponse } from 'next';
import { followEvents, waitForEnd, type JobEndPayload } from './events';

/**
 * Stream a job's events to the browser as Server-Sent Events.
 * Each event carries `id:` so a reconnecting client can send Last-Event-ID and
 * continue exactly where it stopped. The work itself runs in the worker and is not
 * affected when the browser disconnects.
 */
export async function streamJob(req: NextApiRequest, res: NextApiResponse, jobId: string, afterId?: string): Promise<void> {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Job-Id': jobId,
    });
    res.write(`retry: 3000\n\n`);

    const abort = new AbortController();
    req.on('close', () => abort.abort());
    const heartbeat = setInterval(() => res.write(`: keep-alive\n\n`), 15_000);

    try {
        for await (const event of followEvents(jobId, afterId, abort.signal)) {
            if (event.kind === 'end') {
                res.write(`id: ${event.id}\nevent: end\ndata: ${JSON.stringify(event.payload)}\n\n`);
                break;
            }
            res.write(`id: ${event.id}\ndata: ${JSON.stringify(event.payload)}\n\n`);
            (res as unknown as { flush?: () => void }).flush?.();
        }
    } finally {
        clearInterval(heartbeat);
        res.end();
    }
}

/**
 * Wait for a job and return its end payload; used by endpoints that keep a
 * request/response contract (e.g. backup, restore). If the client goes away the
 * job keeps running and its result stays available via GET /api/jobs/:id.
 */
export async function awaitJob(req: NextApiRequest, jobId: string, timeoutMs = 6 * 60 * 60 * 1000): Promise<JobEndPayload | null> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    req.on('close', () => abort.abort());
    try {
        return await waitForEnd(jobId, abort.signal);
    } finally {
        clearTimeout(timer);
    }
}
