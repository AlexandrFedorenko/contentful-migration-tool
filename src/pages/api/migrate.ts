import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';

interface MigrateResponse {
  success?: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MigrateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { spaceId, sourceEnvironment, targetEnvironment, useAdvanced } = req.body;
  
  if (!spaceId || !sourceEnvironment || !targetEnvironment) {
    return res.status(400).json({ 
      error: 'Space ID, source environment and target environment are required' 
    });
  }
  
  try {
    // Выполняем миграцию контента
    await ContentfulManagement.migrateContent(
      spaceId, 
      sourceEnvironment, 
      targetEnvironment,
      useAdvanced
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error migrating content:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to migrate content' 
    });
  }
}
