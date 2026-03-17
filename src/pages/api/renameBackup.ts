import type { NextApiRequest, NextApiResponse } from 'next';
import { BackupService } from '@/utils/backup-service';
import { getAuth } from '@clerk/nextjs/server';

interface RenameBackupRequest {
    spaceId: string;
    oldFileName: string;
    newFileName: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const { spaceId, oldFileName, newFileName } = req.body as RenameBackupRequest;

        if (!spaceId || !oldFileName || !newFileName) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Validate new filename (simple check to prevent directory traversal or invalid chars - still good to have)
        if (!/^[a-zA-Z0-9-_.\s()]+$/.test(newFileName)) {
            return res.status(400).json({ success: false, error: 'Invalid filename. Use letters, numbers, dashes, underscores, dots, spaces, and parentheses.' });
        }

        // Ensure .json extension
        const finalNewFileName = newFileName.endsWith('.json') ? newFileName : `${newFileName}.json`;

        await BackupService.renameBackup(spaceId, userId, oldFileName, finalNewFileName);

        res.status(200).json({ success: true, data: { newFileName: finalNewFileName } });
    } catch (error) {
        console.error('Rename backup error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to rename backup'
        });
    }
}
