import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { spaceId, environmentId } = req.body;

    if (!spaceId || !environmentId) {
        return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user || !user.contentfulToken) {
            return res.status(401).json({ success: false, error: 'Contentful token not set in profile' });
        }

        const token = decrypt(user.contentfulToken);

        const client = ContentfulManagement.getClient(token);
        const space = await client.getSpace(spaceId);
        const environment = await space.getEnvironment(environmentId);

        // Get UI Config which contains entryListViews
        const uiConfig = await environment.getUIConfig();

        return res.status(200).json({
            success: true,
            data: {
                entryListViews: uiConfig.entryListViews || [],
                assetListViews: uiConfig.assetListViews || [],
                version: uiConfig.sys.version
            }
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[GetViews] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch views',
            data: { details: errorMessage }
        });
    }
}
