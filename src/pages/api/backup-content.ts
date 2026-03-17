import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { spaceId, filename } = req.query;

    if (!spaceId || typeof spaceId !== 'string' || !filename || typeof filename !== 'string') {
        return res.status(400).json({ success: false, error: 'Space ID and filename are required' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // 1. Try to find in DB first (Secure & Reliable)
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });

        if (user) {
            const backupRecord = await prisma.backupRecord.findFirst({
                where: {
                    spaceId: spaceId as string,
                    userId: user.id,
                    name: filename as string
                }
            });

            if (backupRecord && backupRecord.content) {
                return res.status(200).json({
                    success: true,
                    data: backupRecord.content
                });
            }
        }

        // 2. Fallback to File System (Legacy)
        const backupsDir = path.join(process.cwd(), 'backups', spaceId as string);
        const filePath = path.join(backupsDir, filename as string);

        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const jsonContent = JSON.parse(fileContent);
            return res.status(200).json({
                success: true,
                data: jsonContent
            });
        }

        return res.status(404).json({ success: false, error: 'Backup not found in Database or File System' });

    } catch (error) {
        console.error('Error reading backup content:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve backup content'
        });
    }
}
