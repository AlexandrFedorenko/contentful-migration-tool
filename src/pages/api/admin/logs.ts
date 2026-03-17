import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // Verify admin status
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true }
        });

        if (user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        if (req.method === 'GET') {
            const {
                page = '1',
                limit = '50',
                level,
                action,
                search,
                status
            } = req.query;

            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const where: Prisma.SystemLogWhereInput = {};
            if (level) where.level = level as string;
            if (action) where.action = action as string;
            if (status) where.status = status as string;
            if (search) {
                where.OR = [
                    { message: { contains: search as string, mode: 'insensitive' } },
                    { userEmail: { contains: search as string, mode: 'insensitive' } },
                    { action: { contains: search as string, mode: 'insensitive' } }
                ];
            }

            const [logs, total] = await Promise.all([
                prisma.systemLog.findMany({
                    where,
                    orderBy: { timestamp: 'desc' },
                    skip,
                    take: limitNum,
                }),
                prisma.systemLog.count({ where })
            ]);

            return res.status(200).json({
                success: true,
                data: {
                    logs,
                    pagination: {
                        total,
                        pages: Math.ceil(total / limitNum),
                        currentPage: pageNum
                    }
                }
            });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Admin Logs API Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
