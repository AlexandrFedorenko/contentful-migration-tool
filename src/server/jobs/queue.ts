import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { HttpError, notFound } from '@/server/http-error';
import { createRedisConnection, getRedis } from '@/server/redis';
import { requestCancel } from './context';
import { getJobDefinition, type JobType } from './definitions';
import { abortJob } from './lifecycle';
import { acquireLock } from './locks';

export const QUEUE_NAME = 'jobs';
/** Parallel jobs a single user may have queued or running. */
const MAX_ACTIVE_JOBS_PER_USER = 3;

const globalForQueue = globalThis as unknown as { __jobsQueue?: Queue };

function getQueue(): Queue {
    if (!globalForQueue.__jobsQueue) {
        globalForQueue.__jobsQueue = new Queue(QUEUE_NAME, {
            connection: createRedisConnection(),
            defaultJobOptions: {
                attempts: 1,
                removeOnComplete: { age: 24 * 60 * 60, count: 10_000 },
                removeOnFail: { age: 7 * 24 * 60 * 60, count: 10_000 },
            },
        });
    }
    return globalForQueue.__jobsQueue;
}

/**
 * Validate and enqueue a job for `userId`. Returns the job id immediately; the work runs
 * in the worker process (or in-process when Redis is not configured, for development).
 */
export async function enqueueJob(userId: string, type: JobType, rawParams: unknown): Promise<string> {
    const definition = getJobDefinition(type);
    const params = definition.schema.parse(rawParams);

    const active = await prisma.job.count({ where: { userId, status: { in: ['QUEUED', 'RUNNING'] } } });
    if (active >= MAX_ACTIVE_JOBS_PER_USER) {
        throw new HttpError(429, 'TOO_MANY_JOBS', `You already have ${active} operations in progress. Wait for one to finish.`);
    }

    const job = await prisma.job.create({
        data: { userId, type, params: params as Prisma.InputJsonValue },
        select: { id: true },
    });

    const lockKey = definition.lockKey?.(params as never);
    if (lockKey && !(await acquireLock(lockKey, job.id))) {
        await prisma.job.update({ where: { id: job.id }, data: { status: 'CANCELLED', error: 'Target is busy', finishedAt: new Date() } });
        throw new HttpError(409, 'TARGET_BUSY', 'Another operation is already modifying this environment. Try again when it finishes.');
    }

    if (getRedis()) {
        await getQueue().add(type, { jobId: job.id }, { jobId: job.id });
    } else {
        // Development without Redis: run in this process. Loaded lazily so the web
        // bundle never pulls in the job implementations otherwise.
        setImmediate(() => void import('./runner').then((m) => m.runJob(job.id)));
    }
    return job.id;
}

export async function getJobForUser(jobId: string, userId: string) {
    const job = await prisma.job.findFirst({
        where: { id: jobId, userId },
        select: { id: true, type: true, status: true, result: true, error: true, createdAt: true, startedAt: true, finishedAt: true, logTail: true },
    });
    if (!job) throw notFound('Job');
    return job;
}

export async function cancelJob(jobId: string, userId: string): Promise<void> {
    const job = await getJobForUser(jobId, userId);
    if (job.status !== 'QUEUED' && job.status !== 'RUNNING') return;
    await requestCancel(jobId);
    if (job.status === 'QUEUED' && getRedis()) {
        // Not picked up yet: drop it from the queue; the runner would also skip it.
        const queued = await getQueue().getJob(jobId);
        if (queued && (await queued.getState()) === 'waiting') {
            await queued.remove();
            await abortJob(jobId, 'CANCELLED', 'Cancelled by user');
        }
    }
}
