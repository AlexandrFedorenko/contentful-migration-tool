import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulManagement } from "@/utils/contentful-management";

interface DiffRequest {
    spaceId: string;
    sourceEnvironment: string;
    targetEnvironment: string;
    entryId: string;
}

interface DiffResponse {
    success: boolean;
    data?: {
        sourceEntry: unknown;
        targetEntry: unknown;
    };
    error?: string;
}

import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DiffResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user || !user.contentfulToken) {
            return res.status(400).json({ success: false, error: "Contentful token not found" });
        }
        const token = decrypt(user.contentfulToken);

        const { spaceId, sourceEnvironment, targetEnvironment, entryId } = req.body as DiffRequest;

        if (!spaceId || !sourceEnvironment || !targetEnvironment || !entryId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const [sourceEntry, targetEntry] = await Promise.all([
            ContentfulManagement.getEntry(spaceId, sourceEnvironment, entryId, token),
            ContentfulManagement.getEntry(spaceId, targetEnvironment, entryId, token)
        ]);

        return res.status(200).json({
            success: true,
            data: {
                sourceEntry,
                targetEntry
            }
        });

    } catch (error) {
        console.error('Diff fetch failed:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
