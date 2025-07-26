import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from '@/utils/contentful-cli';

interface RestoreResponse {
  success?: boolean;
  error?: string;
  details?: string;
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

    console.log("🔍 DEBUG: About to call ContentfulCLI.restoreBackup with params:", {
        spaceId,
        fileName,
        targetEnvironment
    });

    try {
        console.log("🔍 DEBUG: About to call ContentfulCLI.restoreBackup");
        // Восстанавливаем бэкап
        await ContentfulCLI.restoreBackup(spaceId, fileName, targetEnvironment);
        
        console.log("🔍 DEBUG: ContentfulCLI.restoreBackup completed successfully");
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Recovery error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to restore backup';
        
        console.log("🔍 DEBUG: Error message:", errorMessage);
        console.log("🔍 DEBUG: Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        
        return res.status(500).json({ 
            success: false, 
            error: errorMessage,
            details: error instanceof Error ? error.stack : undefined
        });
    }
}
