import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from "@/utils/contentful-cli";
import { ContentfulManagement } from "@/utils/contentful-management";

interface MigrateRequest {
    spaceId: string;
    sourceEnvironment: string;
    targetEnvironment: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
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

    // Enable SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendLog = (message: string) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message })}\n\n`);
    };

    const sendError = (error: string) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
    };

    const sendComplete = (data: any) => {
        res.write(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`);
    };

    try {
        sendLog(`Starting migration check for Space: ${spaceId}`);
        const space = await ContentfulManagement.getSpace(spaceId);
        const spaceName = space?.name || spaceId;
        sendLog(`Space found: ${spaceName}`);

        sendLog(`Creating backup of source environment: ${sourceEnvironment}...`);
        const sourceBackupResult = await ContentfulCLI.createBackup(spaceId, sourceEnvironment, spaceName, (msg) => {
            sendLog(`[Source Backup] ${msg}`);
        });

        if (!sourceBackupResult.success || !sourceBackupResult.backupFile) {
            throw new Error("Failed to create source environment backup");
        }
        sendLog(`Source backup created: ${sourceBackupResult.backupFile}`);

        sendLog(`Creating backup of target environment: ${targetEnvironment}...`);
        const targetBackupResult = await ContentfulCLI.createBackup(spaceId, targetEnvironment, spaceName, (msg) => {
            sendLog(`[Target Backup] ${msg}`);
        });

        if (!targetBackupResult.success || !targetBackupResult.backupFile) {
            throw new Error("Failed to create target environment backup");
        }
        sendLog(`Target backup created: ${targetBackupResult.backupFile}`);

        sendLog(`Restoring content from source backup to target environment...`);
        await ContentfulCLI.restoreBackup(spaceId, sourceBackupResult.backupFile, targetEnvironment, (msg) => {
            sendLog(`[Restore] ${msg}`);
        });

        sendLog(`Migration completed successfully!`);

        sendComplete({
            success: true,
            sourceBackupFile: sourceBackupResult.backupFile,
            targetBackupFile: targetBackupResult.backupFile
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to migrate content';
        sendLog(`Error: ${errorMessage}`);
        sendError(errorMessage);
    } finally {
        res.end();
    }
}
