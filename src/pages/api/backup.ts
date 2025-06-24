import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulCLI } from '@/utils/contentful-cli';
import { ContentfulManagement } from '@/utils/contentful-management';

interface BackupResponse {
  success?: boolean;
  fileName?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BackupResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { spaceId, env } = req.body;
  
  if (!spaceId || !env) {
    return res.status(400).json({ error: 'Space ID and environment are required' });
  }
  
  try {
    // Получаем информацию о спейсе для имени файла
    const space = await ContentfulManagement.getSpace(spaceId);
    const spaceName = space?.name || spaceId; // Используем имя спейса или ID как fallback
    
    // Создаем бэкап с именем спейса
    const result = await ContentfulCLI.createBackup(spaceId, env, spaceName);
    
    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        fileName: result.backupFile 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create backup' 
      });
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create backup' 
    });
  }
}
