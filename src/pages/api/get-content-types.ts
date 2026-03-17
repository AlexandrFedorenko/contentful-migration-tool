import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
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

        const contentTypes = await ContentfulManagement.getContentTypes(spaceId, environmentId, token);
        res.status(200).json({ success: true, data: contentTypes });
    } catch (error) {
        console.error('Failed to fetch content types:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
