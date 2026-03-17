import type { NextApiRequest, NextApiResponse } from 'next';
import { BackupService } from '@/utils/backup-service';
import { getAuth } from '@clerk/nextjs/server';

interface DeleteBackupRequest {
    spaceId: string;
    backupId: string; // Changed from fileName
    fileName?: string; // Legacy support or just ignored
}

interface DeleteBackupResponse {
    success: boolean;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DeleteBackupResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const { backupId }: DeleteBackupRequest = req.body;

        if (!backupId) {
            return res.status(400).json({
                success: false,
                error: 'Backup ID is required'
            });
        }

        await BackupService.deleteBackup(backupId, userId);

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete backup'
        });
    }
}
