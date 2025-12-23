import type { NextApiRequest, NextApiResponse } from 'next';
import { BackupService } from '@/utils/backup-service';
import { Backup } from '@/types/backup';

interface BackupsResponse {
    backups?: Backup[];
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BackupsResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { spaceId } = req.query;

    if (!spaceId || typeof spaceId !== 'string') {
        return res.status(400).json({ error: 'Space ID is required' });
    }

    try {
        const backups = await BackupService.getBackups(spaceId);
        
        return res.status(200).json({ backups });
    } catch (error) {
        return res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Failed to fetch backups' 
        });
    }
}
