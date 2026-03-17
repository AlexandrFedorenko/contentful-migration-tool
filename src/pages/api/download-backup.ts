import type { NextApiRequest, NextApiResponse } from 'next';
import { BackupService } from '@/utils/backup-service';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { backupId, fileName } = req.query;

    if (!backupId || typeof backupId !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Backup ID is required'
        });
    }

    try {
        const content = await BackupService.getBackupContent(backupId, userId);

        // Set headers for file download
        const downloadName = typeof fileName === 'string' ? fileName : `backup-${backupId}.json`;
        const fileContent = JSON.stringify(content, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.setHeader('Content-Length', Buffer.byteLength(fileContent));

        // Send the file
        res.status(200).send(fileContent);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to download backup'
        });
    }
}
