import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';
import { EnvironmentsResponse } from '@/types/api';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<EnvironmentsResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({ 
            success: false,
            error: "Method not allowed" 
        });
    }

    const { spaceId } = req.query;

    if (!spaceId || typeof spaceId !== "string") {
        return res.status(400).json({ 
            success: false,
            error: "Space ID is required" 
        });
    }

    try {
        const environments = await ContentfulManagement.getEnvironments(spaceId);
        
        return res.status(200).json({ 
            success: true,
            environments: environments.map(env => ({
                id: env.id,
                name: env.name,
                createdAt: env.createdAt
            }))
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch environments' 
        });
    }
}
