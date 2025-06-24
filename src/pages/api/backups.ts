import type { NextApiRequest, NextApiResponse } from 'next';
import { BackupService } from '@/utils/backup-service';
import { Backup } from '@/types/backup';

// Определяем интерфейс для объекта бэкапа
interface BackupInfo {
    name: string;
    time: number;
    path: string;
}

// Определяем тип ответа API
interface BackupsResponse {
    backups?: BackupInfo[];
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BackupsResponse>
) {
    const { spaceId } = req.query;
    console.log('📂 Getting backups for spaceId:', spaceId);

    if (!spaceId || typeof spaceId !== 'string') {
        return res.status(400).json({ error: 'Space ID is required' });
    }

    try {
        // Получаем список бэкапов
        const backups = await BackupService.getBackups(spaceId);
        
        return res.status(200).json({ backups });
    } catch (error) {
        console.error('Error fetching backups:', error);
        
        return res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Failed to fetch backups' 
        });
    }
}
