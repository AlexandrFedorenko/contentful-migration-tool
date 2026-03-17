import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
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

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { spaceId } = req.query;

    if (!spaceId || typeof spaceId !== "string") {
        return res.status(400).json({
            success: false,
            error: "Space ID is required"
        });
    }

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user || !user.contentfulToken) {
            return res.status(401).json({ success: false, error: 'Contentful token not set in profile' });
        }

        const token = decrypt(user.contentfulToken);

        res.setHeader('Cache-Control', 'no-store, max-age=0');
        const environments = await ContentfulManagement.getEnvironments(spaceId, token);

        return res.status(200).json({
            success: true,
            data: {
                environments: environments.map(env => ({
                    id: env.id,
                    name: env.name,
                    createdAt: env.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Error in /api/environments:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const statusCode = errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('Forbidden')
            ? 401
            : 500;

        return res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
}
