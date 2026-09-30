/**
 * @jest-environment node
 */
import { mockReset, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

jest.mock('@/lib/db', () => ({ prisma: jest.requireActual('jest-mock-extended').mockDeep() }));
jest.mock('@/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('@/server/jobs/handlers', () => ({ JOB_HANDLERS: { backup: jest.fn(), restore: jest.fn(), 'live-migrate': jest.fn(), 'live-transfer': jest.fn(), 'visual-migration': jest.fn() } }));

import { prisma } from '@/lib/db';
import { appendEvent, followEvents, readEvents } from '@/server/jobs/events';
import { JOB_HANDLERS } from '@/server/jobs/handlers';
import { enqueueJob } from '@/server/jobs/queue';
import { acquireLock, releaseLock } from '@/server/jobs/locks';
import { runJob } from '@/server/jobs/runner';
import { requestCancel } from '@/server/jobs/context';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const USER_ID = 'u-jobs';

describe('job events (in-memory)', () => {
    it('replays events after a given id and stops at end', async () => {
        const jobId = 'job-events-1';
        const first = await appendEvent(jobId, 'data', { n: 1 });
        await appendEvent(jobId, 'data', { n: 2 });
        await appendEvent(jobId, 'end', { status: 'SUCCEEDED' });

        expect((await readEvents(jobId)).map((e) => e.payload)).toEqual([{ n: 1 }, { n: 2 }, { status: 'SUCCEEDED' }]);

        const seen: unknown[] = [];
        for await (const e of followEvents(jobId, first, new AbortController().signal)) seen.push(e.payload);
        expect(seen).toEqual([{ n: 2 }, { status: 'SUCCEEDED' }]);
    });

    it('delivers live events to a follower', async () => {
        const jobId = 'job-events-2';
        const seen: unknown[] = [];
        const done = (async () => {
            for await (const e of followEvents(jobId, undefined, new AbortController().signal)) seen.push(e.kind);
        })();
        await appendEvent(jobId, 'data', 'a');
        await appendEvent(jobId, 'end', { status: 'FAILED' });
        await done;
        expect(seen).toEqual(['data', 'end']);
    });
});

describe('locks', () => {
    it('is exclusive and only released by its owner', async () => {
        expect(await acquireLock('env:s:e', 'a')).toBe(true);
        expect(await acquireLock('env:s:e', 'b')).toBe(false);
        await releaseLock('env:s:e', 'b');
        expect(await acquireLock('env:s:e', 'b')).toBe(false);
        await releaseLock('env:s:e', 'a');
        expect(await acquireLock('env:s:e', 'b')).toBe(true);
        await releaseLock('env:s:e', 'b');
    });
});

describe('enqueueJob', () => {
    beforeEach(() => mockReset(prismaMock));
    const params = { sourceSpaceId: 'a', sourceEnvironmentId: 'master', targetSpaceId: 'a', targetEnvironmentId: 'staging', selectedContentTypeIds: ['post'] };

    it('validates parameters before creating anything', async () => {
        await expect(enqueueJob(USER_ID, 'live-transfer', { ...params, targetSpaceId: '../x' })).rejects.toThrow();
        expect(prismaMock.job.create).not.toHaveBeenCalled();
    });

    it('limits parallel jobs per user', async () => {
        prismaMock.job.count.mockResolvedValue(3);
        await expect(enqueueJob(USER_ID, 'live-transfer', params)).rejects.toMatchObject({ status: 429 });
    });

    it('refuses a second mutating job on the same environment', async () => {
        prismaMock.job.count.mockResolvedValue(0);
        prismaMock.job.create.mockResolvedValue({ id: 'job-lock-2' } as never);
        await acquireLock('env:a:staging', 'job-lock-1');
        await expect(enqueueJob(USER_ID, 'live-transfer', params)).rejects.toMatchObject({ status: 409, code: 'TARGET_BUSY' });
        expect(prismaMock.job.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED' }) }));
        await releaseLock('env:a:staging', 'job-lock-1');
    });
});

describe('runJob', () => {
    beforeEach(() => mockReset(prismaMock));

    function queued(id: string, type = 'restore') {
        prismaMock.job.findUnique.mockResolvedValue({
            id, type, status: 'QUEUED', userId: USER_ID,
            params: { spaceId: 's', targetEnvironment: 'e', backupId: '55555555-5555-4555-8555-555555555555', options: {} },
            user: { id: USER_ID, email: 'x@y.z' },
        } as never);
        prismaMock.job.update.mockResolvedValue({} as never);
    }

    it('records success, emits end and releases the environment lock', async () => {
        queued('job-ok');
        await acquireLock('env:s:e', 'job-ok');
        (JOB_HANDLERS.restore as jest.Mock).mockImplementation(async (ctx) => {
            await ctx.log('working');
            return { done: true };
        });
        await runJob('job-ok');

        const events = await readEvents('job-ok');
        expect(events.map((e) => e.payload)).toEqual([{ message: 'working', type: 'info' }, { status: 'SUCCEEDED', result: { done: true } }]);
        expect(prismaMock.job.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'SUCCEEDED' }) }));
        expect(await acquireLock('env:s:e', 'next')).toBe(true);
        await releaseLock('env:s:e', 'next');
    });

    it('records failures without leaking internals and still releases the lock', async () => {
        queued('job-fail');
        await acquireLock('env:s:e', 'job-fail');
        const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        (JOB_HANDLERS.restore as jest.Mock).mockRejectedValue(new Error('connect ECONNREFUSED /var/run/secret.sock'));
        await runJob('job-fail');
        spy.mockRestore();

        const end = (await readEvents('job-fail')).at(-1)!;
        expect(end.kind).toBe('end');
        expect(end.payload).toEqual({ status: 'FAILED', error: 'Restore failed' });
        expect(await acquireLock('env:s:e', 'next')).toBe(true);
        await releaseLock('env:s:e', 'next');
    });

    it('stops a cancelled job', async () => {
        queued('job-cancel');
        await requestCancel('job-cancel');
        await runJob('job-cancel');
        expect(JOB_HANDLERS.restore).not.toHaveBeenCalledWith(expect.objectContaining({ jobId: 'job-cancel' }));
        expect((await readEvents('job-cancel')).at(-1)!.payload).toMatchObject({ status: 'CANCELLED' });
    });

    it('ignores jobs that are not queued (no double execution)', async () => {
        prismaMock.job.findUnique.mockResolvedValue({ id: 'job-running', status: 'RUNNING' } as never);
        (JOB_HANDLERS.restore as jest.Mock).mockClear();
        await runJob('job-running');
        expect(JOB_HANDLERS.restore).not.toHaveBeenCalled();
    });
});
