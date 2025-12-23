import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from "@/utils/contentful-cli";
import { ContentfulManagement } from "@/utils/contentful-management";
import { MigrationResponse } from "@/types/api";

interface MigrateRequest {
  spaceId: string;
  sourceEnvironment: string;
  targetEnvironment: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MigrationResponse>
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { spaceId, sourceEnvironment, targetEnvironment }: MigrateRequest = req.body;

    if (!spaceId || !sourceEnvironment || !targetEnvironment) {
        return res.status(400).json({ 
            success: false, 
            error: "Space ID, source environment and target environment are required" 
        });
    }

    if (sourceEnvironment === targetEnvironment) {
        return res.status(400).json({ 
            success: false, 
            error: "Source and target environments must be different" 
        });
    }

    try {
        const space = await ContentfulManagement.getSpace(spaceId);
        const spaceName = space?.name || spaceId;

        const sourceBackupResult = await ContentfulCLI.createBackup(spaceId, sourceEnvironment, spaceName);
        if (!sourceBackupResult.success || !sourceBackupResult.backupFile) {
            throw new Error("Failed to create source environment backup");
        }
        
        const targetBackupResult = await ContentfulCLI.createBackup(spaceId, targetEnvironment, spaceName);
        if (!targetBackupResult.success || !targetBackupResult.backupFile) {
            throw new Error("Failed to create target environment backup");
        }
        
        await ContentfulCLI.restoreBackup(spaceId, sourceBackupResult.backupFile, targetEnvironment);
        
        return res.status(200).json({ 
            success: true,
            sourceBackupFile: sourceBackupResult.backupFile,
            targetBackupFile: targetBackupResult.backupFile
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to migrate content'
        });
    }
}
