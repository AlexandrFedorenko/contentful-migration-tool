import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getRedis } from '@/server/redis';

/** GET /api/health — readiness probe: database and Redis reachable. No details are exposed. */
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
    const checks = await Promise.all([
        prisma.$queryRaw`SELECT 1`.then(() => true, () => false),
        (async () => {
            const redis = getRedis();
            return redis ? redis.ping().then(() => true, () => false) : true;
        })(),
    ]);
    const ok = checks.every(Boolean);
    res.setHeader('Cache-Control', 'no-store');
    res.status(ok ? 200 : 503).json({ ok });
}
