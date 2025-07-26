import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from "@/utils/contentful-cli";
import { ContentfulManagement } from "@/utils/contentful-management";
import * as fs from 'fs';
import * as path from 'path';

interface MigrateRequest {
  spaceId: string;
  sourceEnvironment: string;
  targetEnvironment: string;
}

interface MigrateResponse {
  success: boolean;
  error?: string;
  sourceBackupFile?: string;
  targetBackupFile?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MigrateResponse>
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    console.log("📥 Migration request received:", req.body);
    const { spaceId, sourceEnvironment, targetEnvironment } = req.body as MigrateRequest;

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
        // Получаем информацию о спейсе для имени файла (как в backup API)
        const space = await ContentfulManagement.getSpace(spaceId);
        const spaceName = space?.name || spaceId; // Используем имя спейса или ID как fallback
        console.log("🔍 DEBUG: Using space name:", spaceName);

        // 1. Создаем бэкап source окружения
        console.log("🔍 DEBUG: Creating source environment backup");
        const sourceBackupResult = await ContentfulCLI.createBackup(spaceId, sourceEnvironment, spaceName);
        if (!sourceBackupResult.success || !sourceBackupResult.backupFile) {
            throw new Error("Failed to create source environment backup");
        }
        
        // 2. Создаем бэкап target окружения
        console.log("🔍 DEBUG: Creating target environment backup");
        const targetBackupResult = await ContentfulCLI.createBackup(spaceId, targetEnvironment, spaceName);
        if (!targetBackupResult.success || !targetBackupResult.backupFile) {
            throw new Error("Failed to create target environment backup");
        }
        
        // 3. Восстанавливаем source бэкап в target окружение
        console.log("🔍 DEBUG: Restoring source backup to target environment");
        await ContentfulCLI.restoreBackup(spaceId, sourceBackupResult.backupFile, targetEnvironment);
        
        console.log("🔍 DEBUG: Migration completed successfully");
        return res.status(200).json({ 
            success: true,
            sourceBackupFile: sourceBackupResult.backupFile,
            targetBackupFile: targetBackupResult.backupFile
        });
    } catch (error) {
        console.error("❌ Migration error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to migrate content';
        
        return res.status(500).json({ 
            success: false, 
            error: errorMessage
        });
    }
}
