import type { NextApiRequest, NextApiResponse } from 'next';
import { BackupService } from '@/utils/backup-service';
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { spaceId } = req.query;

    if (!spaceId || typeof spaceId !== 'string') {
        return res.status(400).json({ success: false, error: 'Space ID is required' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    try {
        const zipBuffer = await BackupService.createBackupZip(spaceId, userId);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=backups-${spaceId}.zip`);
        res.send(zipBuffer);
    } catch (error) {
        console.error("Zip Error", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create zip'
        });
    }
}
