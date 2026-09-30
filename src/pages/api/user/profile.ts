import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { fetchContentfulProfile, hasActiveToken, saveActiveToken } from '@/server/contentful/credentials';

type Bucket = { date: string; success: number; error: number; total: number };

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Activity histogram computed with a single grouped query instead of one query per bucket. */
async function activity(userId: string, range: '7d' | '30d' | 'all', since: Date): Promise<Bucket[]> {
    const unit = range === 'all' ? 'month' : 'day';
    const now = new Date();
    const start = new Date(now);
    if (range === 'all') {
        start.setTime(since.getTime());
        start.setUTCDate(1);
    } else {
        start.setUTCDate(start.getUTCDate() - (range === '7d' ? 6 : 29));
    }
    start.setUTCHours(0, 0, 0, 0);

    const rows = await prisma.$queryRaw<{ bucket: Date; status: string | null; count: bigint }[]>(Prisma.sql`
        SELECT date_trunc(${unit}, "timestamp" AT TIME ZONE 'UTC') AS bucket, "status", COUNT(*)::bigint AS count
        FROM "SystemLog"
        WHERE "userId" = ${userId} AND "timestamp" >= ${start}
        GROUP BY 1, 2`);

    const byKey = new Map<string, { success: number; error: number }>();
    for (const r of rows) {
        const key = r.bucket.toISOString().slice(0, unit === 'day' ? 10 : 7);
        const entry = byKey.get(key) ?? { success: 0, error: 0 };
        if (r.status === 'SUCCESS') entry.success += Number(r.count);
        if (r.status === 'FAILED') entry.error += Number(r.count);
        byKey.set(key, entry);
    }

    const out: Bucket[] = [];
    const cursor = new Date(start);
    while (cursor <= now) {
        const key = cursor.toISOString().slice(0, unit === 'day' ? 10 : 7);
        const v = byKey.get(key) ?? { success: 0, error: 0 };
        const label = unit === 'month'
            ? MONTH_LABELS[cursor.getUTCMonth()]
            : range === '7d' ? DAY_LABELS[cursor.getUTCDay()] : String(cursor.getUTCDate()).padStart(2, '0');
        out.push({ date: label, ...v, total: v.success + v.error });
        if (unit === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1);
        else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return out;
}

export default createApiHandler({
    GET: route({
        query: z.object({ range: z.enum(['7d', '30d', 'all']).default('7d') }),
        handler: async (_req, _res, { user, query }) => {
            const dbUser = await prisma.user.findUniqueOrThrow({
                where: { id: user.id },
                select: { id: true, role: true, displayName: true, createdAt: true },
            });
            const [act, totalActions, successActions, backupCount, isContentfulTokenSet] = await Promise.all([
                activity(dbUser.id, query.range, dbUser.createdAt),
                prisma.systemLog.count({ where: { userId: dbUser.id } }),
                prisma.systemLog.count({ where: { userId: dbUser.id, status: 'SUCCESS' } }),
                prisma.backupRecord.count({ where: { userId: dbUser.id } }),
                hasActiveToken(dbUser.id),
            ]);
            return {
                role: dbUser.role,
                displayName: dbUser.displayName || '',
                isContentfulTokenSet,
                backupCount,
                stats: {
                    activity: act,
                    totalActions,
                    successRate: totalActions > 0 ? Math.round((successActions / totalActions) * 100) : 100,
                },
            };
        },
    }),
    POST: route({
        body: z.object({
            displayName: z.string().trim().max(80).optional(),
            contentfulToken: z.string().trim().max(200).optional(),
        }),
        rateLimit: { limit: 20, windowSeconds: 60 },
        handler: async (_req, _res, { user, body }) => {
            if (body.displayName !== undefined) {
                await prisma.user.update({ where: { id: user.id }, data: { displayName: body.displayName || null } });
            }
            if (body.contentfulToken) {
                await fetchContentfulProfile(body.contentfulToken);
                await saveActiveToken(user.id, body.contentfulToken, 'PAT', 'Personal access token');
            }
            return { message: 'Profile updated successfully', tokenSet: await hasActiveToken(user.id) };
        },
    }),
});
