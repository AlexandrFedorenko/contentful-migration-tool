import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';

const MIGRATION_ACTIONS = ['JOB_LIVE-MIGRATE', 'JOB_LIVE-TRANSFER', 'JOB_VISUAL-MIGRATION', 'JOB_RESTORE', 'MIGRATION_RUN', 'SMART_MIGRATE'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** GET /api/admin/stats — dashboard numbers; aggregated in the database, not per-day queries. */
export default createApiHandler({
    GET: route({
        auth: 'admin',
        handler: async () => {
            const start = new Date();
            start.setUTCHours(0, 0, 0, 0);
            start.setUTCDate(start.getUTCDate() - 6);

            const [rows, totalUsers, admins, migrationRows, storage, jobs, dbSizeRows] = await Promise.all([
                prisma.$queryRaw<{ day: Date; status: string | null; count: bigint }[]>(Prisma.sql`
                    SELECT date_trunc('day', "timestamp" AT TIME ZONE 'UTC') AS day, "status", COUNT(*)::bigint AS count
                    FROM "SystemLog" WHERE "timestamp" >= ${start} GROUP BY 1, 2`),
                prisma.user.count(),
                prisma.user.count({ where: { role: 'ADMIN' } }),
                prisma.systemLog.groupBy({ by: ['status'], where: { action: { in: MIGRATION_ACTIONS } }, _count: { _all: true } }),
                prisma.backupRecord.aggregate({ _sum: { sizeBytes: true } }),
                prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),
                prisma.$queryRaw<{ size: string }[]>`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`.catch(() => []),
            ]);

            const byDay = new Map<string, { success: number; error: number }>();
            for (const r of rows) {
                const k = r.day.toISOString().slice(0, 10);
                const v = byDay.get(k) ?? { success: 0, error: 0 };
                if (r.status === 'SUCCESS') v.success += Number(r.count);
                if (r.status === 'FAILED') v.error += Number(r.count);
                byDay.set(k, v);
            }
            const activity = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(start);
                d.setUTCDate(start.getUTCDate() + i);
                const v = byDay.get(d.toISOString().slice(0, 10)) ?? { success: 0, error: 0 };
                return { date: `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}`, ...v, total: v.success + v.error };
            });

            const totalMigrations = migrationRows.reduce((n, r) => n + r._count._all, 0);
            const successfulMigrations = migrationRows.find((r) => r.status === 'SUCCESS')?._count._all ?? 0;
            const storageBytes = Number(storage._sum.sizeBytes ?? 0);

            return {
                activity,
                summary: {
                    totalUsers,
                    totalMigrations,
                    migrationSuccessRate: totalMigrations > 0 ? Math.round((successfulMigrations / totalMigrations) * 100) : 100,
                    admins,
                    members: totalUsers - admins,
                    dbSize: dbSizeRows[0]?.size ?? 'Unknown',
                    diskUsage: `${(storageBytes / 1048576).toFixed(2)} MB`,
                    jobs: Object.fromEntries(jobs.map((j) => [j.status, j._count._all])),
                },
            };
        },
    }),
});
