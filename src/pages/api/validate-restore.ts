import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulManagement } from '@/utils/contentful-management';
import * as fs from 'fs';
import * as path from 'path';
import type { Locale } from '@/types/common';
import type { BackupData } from '@/types/backup';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }



    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { spaceId, targetEnvironment, backupContent, fileName, backupId } = req.body;

        if (!spaceId || !targetEnvironment) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        let parsedLocales: Locale[] = [];

        // Strategy 1: Content provided directly (e.g. from client upload)
        if (backupContent) {
            parsedLocales = (backupContent.locales || []) as Locale[];
        }
        // Strategy 2: BackupId provided (database backup)
        else if (backupId) {
            const { BackupService } = await import('@/utils/backup-service');
            const backupData = await BackupService.getBackupContent(backupId, userId) as BackupData;
            parsedLocales = (backupData.locales || []) as Locale[];
        }
        // Strategy 3: Filename provided (server-side file backup)
        else if (fileName) {
            const backupsDir = path.join(process.cwd(), 'backups', spaceId);
            const backupPath = path.join(backupsDir, fileName);

            if (!fs.existsSync(backupPath)) {
                return res.status(404).json({ error: 'Backup file not found' });
            }

            const fileStr = fs.readFileSync(backupPath, 'utf-8');
            const json = JSON.parse(fileStr);
            parsedLocales = (json.locales || []) as Locale[];
        } else {
            return res.status(400).json({ error: 'Either backupContent, backupId, or fileName must be provided' });
        }

        const user = await prisma.user.findUnique({ where: { clerkId: userId } });

        if (!user || !user.contentfulToken) {
            return res.status(401).json({ error: 'Contentful token not set/found' });
        }

        const token = decrypt(user.contentfulToken);

        // 1. Fetch Target Locales
        const targetLocalesData = await ContentfulManagement.getLocales(spaceId, targetEnvironment, token);
        const targetLocales: Locale[] = targetLocalesData.map((l: Locale) => ({
            code: l.code,
            default: l.default,
            name: l.name
        }));

        // 2. Parse Backup Locales
        let sourceLocalesRaw = parsedLocales.map((l: Locale) => ({
            code: l.code,
            default: l.default,
            name: l.name
        }));

        const { options } = req.body;

        // Filter by selected locales if provided
        if (options?.locales && Array.isArray(options.locales) && options.locales.length > 0) {
            const selectedSet = new Set(options.locales);
            sourceLocalesRaw = sourceLocalesRaw.filter((l: Locale) => selectedSet.has(l.code));
        }

        const sourceLocales = sourceLocalesRaw;

        const sourceDefault = sourceLocales.find((l: Locale) => l.default);
        const targetDefault = targetLocales.find((l: Locale) => l.default);



        // 3. Analyze Mismatches
        // Check default mismatch ONLY if the source default locale is actually being restored
        const defaultMismatch = sourceDefault ? (sourceDefault.code !== targetDefault?.code) : false;

        const targetCodes = new Set(targetLocales.map((l: Locale) => l.code));
        const missingInTarget = sourceLocales
            .filter((l: Locale) => !targetCodes.has(l.code))
            .map((l: Locale) => l.code);



        const status = (defaultMismatch || missingInTarget.length > 0) ? 'mismatch' : 'ok';


        return res.status(200).json({
            success: true,
            data: {
                status,
                sourceLocales,
                targetLocales,
                details: {
                    defaultMismatch,
                    missingInTarget
                }
            }
        });

    } catch (error) {
        console.error('[VALIDATE-RESTORE] Error:', error);
        return res.status(500).json({ error: 'Failed to validate restore' });
    }
}