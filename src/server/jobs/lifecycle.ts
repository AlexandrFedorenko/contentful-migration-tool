import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { appendEvent, type JobEndPayload } from './events';
import { getJobDefinition } from './definitions';
import { releaseLock } from './locks';

/** Record the final state of a job and publish the terminal `end` event. */
export async function finishJob(jobId: string, end: JobEndPayload, logTail: string[]): Promise<void> {
    await prisma.job.update({
        where: { id: jobId },
        data: {
            status: end.status,
            result: (end.result ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            error: end.error ?? null,
            logTail: logTail as Prisma.InputJsonValue,
            finishedAt: new Date(),
        },
    });
    await appendEvent(jobId, 'end', end);
}

/**
 * End a job that is not (or no longer) executing: cancelled while queued, or its
 * worker died. Jobs are never retried automatically: a half-applied migration must
 * be reviewed by a human, not replayed blindly.
 */
export async function abortJob(jobId: string, status: 'FAILED' | 'CANCELLED', reason: string): Promise<void> {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true, type: true, params: true } });
    if (!job || (job.status !== 'RUNNING' && job.status !== 'QUEUED')) return;
    await finishJob(jobId, { status, error: reason }, []);
    const lockKey = getJobDefinition(job.type).lockKey?.(job.params as never);
    if (lockKey) await releaseLock(lockKey, jobId).catch(() => undefined);
}
