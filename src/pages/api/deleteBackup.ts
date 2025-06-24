import type { NextApiRequest, NextApiResponse } from 'next';
import { BackupService } from '@/utils/backup-service';

// Определяем тип ответа API
interface DeleteBackupResponse {
    success?: boolean;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DeleteBackupResponse>
) {
    console.log('🔍 Delete backup request received:', {
        method: req.method,
        body: req.body
    });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { spaceId, fileName } = req.body;
        
        if (!spaceId || !fileName) {
            return res.status(400).json({ error: 'Space ID and file name are required' });
        }
        
        // Удаляем бэкап
        await BackupService.deleteBackup(spaceId, fileName);
        
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting backup:', error);
        
        return res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to delete backup' 
        });
    }
}
