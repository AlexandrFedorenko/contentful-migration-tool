import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return res.status(404).json({ success: false, error: 'User not found' });

    if (req.method === 'DELETE') {
        try {
            const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
            if (!dbUser) return res.status(404).json({ success: false, error: 'User not found' });

            // 1. Find all logs with files to delete them from disk first
            const logsWithFiles = await prisma.systemLog.findMany({
                where: { userId: dbUser.id, logFile: { not: null } as Prisma.StringNullableFilter },
                select: { logFile: true }
            });

            const appDir = process.cwd();
            const safeDir = path.join(appDir, 'backups', 'logs');

            for (const log of logsWithFiles) {
                if (log.logFile) {
                    const filePath = path.join(appDir, log.logFile);
                    if (filePath.startsWith(safeDir) && fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch {
                            // Ignore file deletion errors
                        }
                    }
                }
            }

            // 2. Delete all log entries from DB
            await prisma.systemLog.deleteMany({
                where: { userId: dbUser.id }
            });

            return res.status(200).json({ success: true, message: 'All logs cleared' });
        } catch {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { page = '1', limit = '15', level, status, search } = req.query;
        const pageNum = parseInt(page as string, 10);
        const isAll = limit === 'all';
        const limitNum = isAll ? 0 : parseInt(limit as string, 10);
        const skip = isAll ? 0 : (pageNum - 1) * limitNum;

        const where: Prisma.SystemLogWhereInput = { userId: dbUser.id };
        if (level && level !== 'ALL') where.level = level as string;
        if (status && status !== 'ALL') where.status = status as string;
        if (search) {
            where.OR = [
                { message: { contains: search as string, mode: 'insensitive' } },
                { action: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.systemLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                ...(isAll ? {} : { take: limitNum }),
                select: {
                    id: true,
                    level: true,
                    action: true,
                    message: true,
                    details: true,
                    status: true,
                    timestamp: true,
                    logFile: true,
                }
            }),
            prisma.systemLog.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                logs,
                total,
                page: pageNum,
                totalPages: isAll ? 1 : Math.ceil(total / limitNum),
            }
        });
    } catch {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
