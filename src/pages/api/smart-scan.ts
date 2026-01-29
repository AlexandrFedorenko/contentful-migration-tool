import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';
import fs from 'fs';
import path from 'path';

interface SmartScanResponse {
    success: boolean;
    sourceBackup?: string;
    targetBackup?: string;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SmartScanResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { spaceId, sourceEnv, targetEnv } = req.body;

    if (!spaceId || !sourceEnv || !targetEnv) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: spaceId, sourceEnv, targetEnv'
        });
    }

    try {
        const space = await ContentfulManagement.getSpace(spaceId);
        const spaceName = space?.name || spaceId;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(process.cwd(), 'backups', spaceId);

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Create backup for Source environment using Management API (includes drafts)
        console.log(`[SmartScan] Starting backup for Source: ${sourceEnv} (with drafts)`);
        const sourceResult = await ContentfulManagement.createFullBackup(
            spaceId,
            sourceEnv,
            (msg) => console.log(`[Source] ${msg}`)
        );

        if (!sourceResult.success || !sourceResult.backupData) {
            throw new Error(`Failed to backup source environment: ${sourceEnv}`);
        }

        // Save source backup to file
        const sourceBackupFile = `${spaceName}-${sourceEnv}-${timestamp}.json`;
        const sourceBackupPath = path.join(backupDir, sourceBackupFile);
        fs.writeFileSync(sourceBackupPath, JSON.stringify(sourceResult.backupData, null, 2));
        console.log(`[SmartScan] Source backup saved: ${sourceBackupFile}`);

        // Create backup for Target environment using Management API (includes drafts)
        console.log(`[SmartScan] Starting backup for Target: ${targetEnv} (with drafts)`);
        const targetResult = await ContentfulManagement.createFullBackup(
            spaceId,
            targetEnv,
            (msg) => console.log(`[Target] ${msg}`)
        );

        if (!targetResult.success || !targetResult.backupData) {
            throw new Error(`Failed to backup target environment: ${targetEnv}`);
        }

        // Save target backup to file
        const targetBackupFile = `${spaceName}-${targetEnv}-${timestamp}.json`;
        const targetBackupPath = path.join(backupDir, targetBackupFile);
        fs.writeFileSync(targetBackupPath, JSON.stringify(targetResult.backupData, null, 2));
        console.log(`[SmartScan] Target backup saved: ${targetBackupFile}`);

        // Log file sizes
        const sourceStats = fs.statSync(sourceBackupPath);
        const targetStats = fs.statSync(targetBackupPath);


        return res.status(200).json({
            success: true,
            sourceBackup: sourceBackupFile,
            targetBackup: targetBackupFile
        });

    } catch (error) {
        console.error('[SmartScan] Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during smart scan'
        });
    }
}
