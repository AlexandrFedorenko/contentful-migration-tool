import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { spaceId, environmentId } = req.body;

    if (!spaceId || !environmentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const client = ContentfulManagement.getClient();
        const space = await client.getSpace(spaceId);
        const environment = await space.getEnvironment(environmentId);

        // Get UI Config which contains entryListViews
        const uiConfig = await environment.getUIConfig();

        return res.status(200).json({
            success: true,
            entryListViews: uiConfig.entryListViews || [],
            assetListViews: uiConfig.assetListViews || [],
            version: uiConfig.sys.version
        });
    } catch (error: any) {
        console.error('[GetViews] Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch views',
            details: error.message
        });
    }
}
