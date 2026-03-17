import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function getDirSize(dirPath: string): Promise<number> {
    let size = 0;
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                size += await getDirSize(filePath);
            } else {
                const stats = await fs.stat(filePath);
                size += stats.size;
            }
        }
    } catch {
        // ignore if not exists
    }
    return size;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true }
        });

        if (user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        if (req.method === 'GET') {
            const now = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => subDays(now, i)).reverse();

            // 1. Activity Chart Data (last 7 days)
            const dailyActivity = await Promise.all(last7Days.map(async (date) => {
                const dayStart = startOfDay(date);
                const dayEnd = endOfDay(date);

                const [success, error] = await Promise.all([
                    prisma.systemLog.count({
                        where: {
                            timestamp: { gte: dayStart, lte: dayEnd },
                            status: 'SUCCESS'
                        }
                    }),
                    prisma.systemLog.count({
                        where: {
                            timestamp: { gte: dayStart, lte: dayEnd },
                            status: 'FAILED'
                        }
                    })
                ]);

                return {
                    date: format(date, 'MMM dd'),
                    success,
                    error,
                    total: success + error
                };
            }));

            // 2. Summary stats
            const totalUsers = await prisma.user.count();
            const totalMigrations = await prisma.systemLog.count({
                where: { action: { in: ['MIGRATION_RUN', 'SMART_MIGRATE'] } }
            });
            const successfulMigrations = await prisma.systemLog.count({
                where: {
                    action: { in: ['MIGRATION_RUN', 'SMART_MIGRATE'] },
                    status: 'SUCCESS'
                }
            });

            // 3. User distribution (role)
            const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
            const members = await prisma.user.count({ where: { role: 'MEMBER' } });

            // 4. Infrastructure Health
            let dbSize = 'Unknown';
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result: any = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size`;
                if (result && result.length > 0) {
                    dbSize = result[0].size;
                }
            } catch (e) {
                console.error("Failed to fetch DB size", e);
            }

            const backupsPath = path.join(process.cwd(), 'public', 'backups');
            const diskUsageBytes = await getDirSize(backupsPath);
            const diskUsageMB = (diskUsageBytes / (1024 * 1024)).toFixed(2) + ' MB';

            return res.status(200).json({
                success: true,
                data: {
                    activity: dailyActivity,
                    summary: {
                        totalUsers,
                        totalMigrations,
                        migrationSuccessRate: totalMigrations > 0 ? Math.round((successfulMigrations / totalMigrations) * 100) : 100,
                        admins,
                        members,
                        dbSize,
                        diskUsage: diskUsageMB
                    }
                }
            });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Admin Stats API Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
