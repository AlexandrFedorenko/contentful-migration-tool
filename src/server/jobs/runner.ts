import { prisma } from '@/lib/db';
import { publicErrorMessage } from '@/server/api';
import * as storage from '@/server/storage';
import { logger } from '@/utils/logger';
import { JobCancelledError, JobContext } from './context';
import { getJobDefinition, type JobType } from './definitions';
import { JOB_HANDLERS } from './handlers';
import { finishJob } from './lifecycle';
import { releaseLock } from './locks';

/**
 * Execute one job. Used by the BullMQ worker and by the in-process fallback.
 * Never throws: the outcome is recorded on the Job row and as the final `end` event.
 */
export async function runJob(jobId: string): Promise<void> {
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { user: { select: { id: true, email: true } } },
    });
    if (!job || job.status !== 'QUEUED') return;

    const definition = getJobDefinition(job.type);
    const handler = JOB_HANDLERS[job.type as JobType];
    const ctx = new JobContext(job.id, job.userId, job.params, definition.formatLog);
    const lockKey = definition.lockKey?.(job.params as never) ?? null;

    await prisma.job.update({ where: { id: job.id }, data: { status: 'RUNNING', startedAt: new Date() } });
    const started = Date.now();

    try {
        await ctx.throwIfCancelled();
        const result = await handler(ctx);
        await finishJob(job.id, { status: 'SUCCEEDED', result }, ctx.logTail);
        await logger.info(`JOB_${job.type.toUpperCase()}`, `${definition.title} completed`, { jobId: job.id, ms: Date.now() - started }, job.user);
    } catch (error) {
        const cancelled = error instanceof JobCancelledError;
        const message = cancelled ? 'Cancelled by user' : publicErrorMessage(error, `${definition.title} failed`);
        if (!cancelled) console.error(`[job ${job.id}] ${job.type} failed`, error);
        ctx.logTail.push(`[${new Date().toISOString()}] ERROR ${message}`);
        const failure = definition.formatError?.(message) ?? definition.formatLog?.(message, 'error') ?? { type: 'error', payload: message };
        await ctx.emit(failure).catch(() => undefined);
        await finishJob(job.id, { status: cancelled ? 'CANCELLED' : 'FAILED', error: message }, ctx.logTail).catch((e) =>
            console.error(`[job ${job.id}] could not record failure`, e)
        );
        await logger.error(
            `JOB_${job.type.toUpperCase()}`,
            `${definition.title} ${cancelled ? 'cancelled' : 'failed'}: ${message}`,
            { jobId: job.id, log: ctx.logTail.slice(-100) },
            job.user
        );
    } finally {
        if (lockKey) await releaseLock(lockKey, job.id).catch(() => undefined);
        await storage.remove(storage.keys.jobDir(job.id)).catch(() => undefined);
    }
}
