import type { NextApiRequest, NextApiResponse } from 'next';
import { BackupService } from '@/utils/backup-service';
import { Backup } from '@/types/backup';
import { getAuth } from '@clerk/nextjs/server';

interface BackupsResponse {
    success: boolean;
    data?: {
        backups: Backup[];
    };
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BackupsResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { spaceId } = req.query;

    if (!spaceId || typeof spaceId !== 'string') {
        return res.status(400).json({ success: false, error: 'Space ID is required' });
    }

    try {
        // Now passing userId to fetch DB records
        const backups = await BackupService.getBackups(spaceId, userId);

        return res.status(200).json({
            success: true,
            data: { backups }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch backups'
        });
    }
}
