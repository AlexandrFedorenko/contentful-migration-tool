import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { spaceId, environmentId } = req.body;

    if (!spaceId || !environmentId) {
        return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    try {
        const contentTypes = await ContentfulManagement.getContentTypes(spaceId, environmentId);
        res.status(200).json({ success: true, items: contentTypes });
    } catch (error) {
        console.error('Failed to fetch content types:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
