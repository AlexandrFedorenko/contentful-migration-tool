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
    sourceEntry?: any;
    targetEntry?: any;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DiffResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { spaceId, sourceEnvironment, targetEnvironment, entryId } = req.body as DiffRequest;

        if (!spaceId || !sourceEnvironment || !targetEnvironment || !entryId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const [sourceEntry, targetEntry] = await Promise.all([
            ContentfulManagement.getEntry(spaceId, sourceEnvironment, entryId),
            ContentfulManagement.getEntry(spaceId, targetEnvironment, entryId)
        ]);

        return res.status(200).json({
            success: true,
            sourceEntry,
            targetEntry
        });

    } catch (error) {
        console.error('Diff fetch failed:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
