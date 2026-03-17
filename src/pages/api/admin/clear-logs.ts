import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

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

        const { retention } = req.body;

        if (!retention) {
            return res.status(400).json({ success: false, error: 'Retention policy is required' });
        }

        let whereClause: Prisma.SystemLogWhereInput = {};
        const retentionMonths: Record<string, number> = {
            '1m': 1,
            '3m': 3,
            '6m': 6,
        };

        if (retention in retentionMonths) {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths[retention]);
            whereClause = {
                timestamp: {
                    lt: cutoffDate
                }
            };
        } else if (retention !== 'all') {
            return res.status(400).json({ success: false, error: 'Invalid retention policy' });
        }

        // 1. Find logs with associated files to delete them from disk
        const logsWithFiles = await prisma.systemLog.findMany({
            where: {
                ...whereClause,
                logFile: { not: null }
            },
            select: { logFile: true }
        });

        for (const log of logsWithFiles) {
            if (log.logFile) {
                try {
                    const fullPath = path.join(process.cwd(), log.logFile);
                    fs.rmSync(fullPath, { force: true });
                } catch {
                    // Ignore file deletion errors
                }
            }
        }

        // 2. Clear database records
        const deleted = await prisma.systemLog.deleteMany({
            where: whereClause
        });

        return res.status(200).json({
            success: true,
            data: {
                count: deleted.count,
                message: `Successfully deleted ${deleted.count} logs and associated files`
            }
        });

    } catch {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
