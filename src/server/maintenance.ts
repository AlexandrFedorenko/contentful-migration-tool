import { readdir } from 'fs/promises';
import { prisma } from '@/lib/db';
import * as storage from '@/server/storage';

/**
 * Periodic housekeeping, run by the worker:
 *  - expired sessions
 *  - job scratch directories and restore uploads left behind by crashes
 *  - old finished job rows (their results are summarized in SystemLog)
 */
export async function runMaintenance(): Promise<Record<string, number>> {
    const now = Date.now();
    const [sessions, jobs] = await Promise.all([
        prisma.session.deleteMany({ where: { expiresAt: { lt: new Date(now) } } }),
        prisma.job.deleteMany({
            where: { status: { in: ['SUCCEEDED', 'FAILED', 'CANCELLED'] }, finishedAt: { lt: new Date(now - 90 * 24 * 3600 * 1000) } },
        }),
    ]);
    const jobDirs = await storage.purgeOlderThan(['jobs'], 12 * 3600 * 1000);
    let uploads = 0;
    for (const u of await readdir(storage.storagePath('uploads')).catch(() => [] as string[])) {
        uploads += await storage.purgeOlderThan(['uploads', u], 24 * 3600 * 1000);
    }
    return { sessions: sessions.count, jobs: jobs.count, jobDirs, uploads };
}
