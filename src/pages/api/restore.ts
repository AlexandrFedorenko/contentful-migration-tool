import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from '@/utils/contentful-cli';
import { RestoreResponse } from '@/types/api';

interface RestoreRequest {
  spaceId: string;
  fileName: string;
  targetEnvironment: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RestoreResponse>
) {
    if (req.method !== "POST") {
        return res.status(405).json({ 
            success: false,
            error: "Method not allowed" 
        });
    }

    const { spaceId, fileName, targetEnvironment }: RestoreRequest = req.body;

    if (!spaceId || !fileName || !targetEnvironment) {
        return res.status(400).json({ 
            success: false,
            error: "Space ID, file name and target environment are required" 
        });
    }

    try {
        await ContentfulCLI.restoreBackup(spaceId, fileName, targetEnvironment);
        return res.status(200).json({ 
            success: true 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to restore backup'
        });
    }
}
