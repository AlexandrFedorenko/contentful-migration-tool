import type { NextApiRequest, NextApiResponse } from 'next';
import { BackupService } from '@/utils/backup-service';

interface DeleteBackupRequest {
    spaceId: string;
    fileName: string;
    filePath?: string;
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

    try {
        const { spaceId, fileName }: DeleteBackupRequest = req.body;
        
        if (!spaceId || !fileName) {
            return res.status(400).json({ 
                success: false,
                error: 'Space ID and file name are required' 
            });
        }
        
        await BackupService.deleteBackup(spaceId, fileName);
        
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to delete backup' 
        });
    }
}
