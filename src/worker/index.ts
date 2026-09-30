/**
 * Background worker: executes jobs from the BullMQ queue (backups, restores,
 * migrations) outside the web process, so long operations survive browser
 * disconnects and web deploys, and heavy work never blocks HTTP handling.
 *
 * Run with `npm run worker` (dev) or `node dist/worker.js` (production image).
 */
import http from 'http';
import os from 'os';
import { Worker } from 'bullmq';
import { prisma } from '@/lib/db';
import { getEnv } from '@/server/env';
import { createRedisConnection, getRedis } from '@/server/redis';
import { QUEUE_NAME } from '@/server/jobs/queue';
import { abortJob } from '@/server/jobs/lifecycle';
import { acquireLock, releaseLock } from '@/server/jobs/locks';
import { runJob } from '@/server/jobs/runner';
import { runMaintenance } from '@/server/maintenance';
import { ensureDir, storagePath } from '@/server/storage';

const log = (msg: string, extra?: unknown) =>
    console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', component: 'worker', msg, ...(extra ? { extra } : {}) }));

async function main() {
    const env = getEnv();
    if (!env.REDIS_URL) throw new Error('The worker requires REDIS_URL');
    await ensureDir(storagePath());
    await prisma.$queryRaw`SELECT 1`;

    // Jobs still marked RUNNING belong to a worker that died mid-way (e.g. OOM kill).
    // BullMQ reports them as stalled; this catches rows whose queue entry is already gone.
    const orphaned = await prisma.job.findMany({
        where: { status: 'RUNNING', startedAt: { lt: new Date(Date.now() - 12 * 3600 * 1000) } },
        select: { id: true },
    });
    for (const j of orphaned) await abortJob(j.id, 'FAILED', 'The worker stopped while this operation was running. Check the target environment and restore from the safety backup if needed.');

    const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            log('job started', { id: job.id, type: job.name });
            await runJob(String(job.data.jobId));
            log('job finished', { id: job.id, type: job.name });
        },
        {
            connection: createRedisConnection(),
            concurrency: env.WORKER_CONCURRENCY,
            lockDuration: 60_000,
            // A job whose worker vanished is failed, never silently re-run:
            // replaying a half-applied migration could duplicate or overwrite content.
            maxStalledCount: 0,
        }
    );

    worker.on('failed', (job, err) => {
        if (!job) return;
        log('job failed in queue', { id: job.id, error: err.message });
        void abortJob(String(job.data.jobId), 'FAILED', 'The operation was interrupted (worker restarted). Check the target environment and restore from the safety backup if needed.');
    });
    worker.on('error', (err) => console.error('[worker] error', err));

    // Hourly housekeeping; the lock makes sure only one replica runs it.
    const maintenance = setInterval(async () => {
        const owner = `${os.hostname()}:${process.pid}`;
        if (!(await acquireLock('maintenance', owner))) return;
        try {
            log('maintenance', await runMaintenance());
        } catch (e) {
            console.error('[worker] maintenance failed', e);
        } finally {
            await releaseLock('maintenance', owner);
        }
    }, 60 * 60 * 1000);

    // Liveness endpoint for the container healthcheck.
    const health = http.createServer(async (_req, res) => {
        const ok = worker.isRunning() && (await getRedis()!.ping().then(() => true, () => false));
        res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok }));
    });
    health.listen(Number(process.env.WORKER_HEALTH_PORT || 3001));

    log('worker started', { concurrency: env.WORKER_CONCURRENCY });

    const shutdown = async (signal: string) => {
        log(`received ${signal}, finishing active jobs...`);
        clearInterval(maintenance);
        health.close();
        // Waits for running jobs to complete; the orchestrator's stop timeout
        // (stop_grace_period in compose) bounds how long that may take.
        await worker.close();
        await prisma.$disconnect();
        await getRedis()?.quit();
        process.exit(0);
    };
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
    console.error('[worker] fatal', err);
    process.exit(1);
});
