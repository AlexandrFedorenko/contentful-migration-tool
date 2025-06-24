import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from '@/utils/contentful-cli';

interface RestoreResponse {
    success?: boolean;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RestoreResponse>
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("📥 Backup restore request received:", req.body);
    const { spaceId, fileName, targetEnvironment } = req.body;

    if (!spaceId || !fileName || !targetEnvironment) {
        console.error("❌ Error: missing parameters");
        return res.status(400).json({ error: "Space ID, file name and target environment are required" });
    }

    try {
        // Восстанавливаем бэкап
        await ContentfulCLI.restoreBackup(spaceId, fileName, targetEnvironment);
        
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Recovery error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to restore backup' 
        });
    }
}
