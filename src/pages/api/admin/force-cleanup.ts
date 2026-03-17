import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // 1. Verify admin status
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, role: true, email: true }
        });

        if (user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        let foldersDeleted = 0;
        let filesDeleted = 0;

        // 2. Clear root CLI folders (images.ctfassets.net)
        const rootFolder = path.join(process.cwd(), 'images.ctfassets.net');
        if (fs.existsSync(rootFolder)) {
            fs.rmSync(rootFolder, { recursive: true, force: true });
            foldersDeleted++;
        }

        // 3. Clear all ZIP files in backups directory
        const backupsDir = path.join(process.cwd(), 'backups');
        if (fs.existsSync(backupsDir)) {
            const spaces = fs.readdirSync(backupsDir);
            for (const space of spaces) {
                const spacePath = path.join(backupsDir, space);
                if (fs.statSync(spacePath).isDirectory()) {
                    const files = fs.readdirSync(spacePath);
                    for (const file of files) {
                        if (file.endsWith('.zip')) {
                            fs.unlinkSync(path.join(spacePath, file));
                            filesDeleted++;
                        }
                    }
                }
            }
        }

        // 4. Log the action
        await logger.info(
            'ADMIN_FORCE_CLEANUP',
            `Admin triggered force cleanup of temporary files. Deleted ${foldersDeleted} folders and ${filesDeleted} archives.`,
            { foldersDeleted, filesDeleted },
            { id: user.id, email: user.email }
        );

        return res.status(200).json({
            success: true,
            data: {
                message: `Cleanup complete. Deleted ${foldersDeleted} folders and ${filesDeleted} archives.`,
                stats: { foldersDeleted, filesDeleted }
            }
        });

    } catch (error) {
        console.error('Force Cleanup API Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}
