import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';
import { Environment } from '@/types/common';

// Определяем тип ответа API
interface EnvironmentsResponse {
    environments?: Environment[];
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<EnvironmentsResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { spaceId } = req.query;

    if (!spaceId || typeof spaceId !== "string") {
        return res.status(400).json({ error: "Space ID is required" });
    }

    try {
        // Получаем список окружений
        const environments = await ContentfulManagement.getEnvironments(spaceId);
        
        return res.status(200).json({ environments });
    } catch (error) {
        console.error('Error fetching environments:', error);
        
        return res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Failed to fetch environments' 
        });
    }
}
