import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from '@/utils/contentful-cli';
import { RestoreResponse } from '@/types/api';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from 'contentful-management';
import { ContentfulManagement } from '@/utils/contentful-management';
import { BackupService } from '@/utils/backup-service';
import { logger } from "@/utils/logger";
import { BackupData, BackupLocale } from "@/types/backup";
import { Fields, Files } from 'formidable';

import { IncomingForm } from 'formidable';
import AdmZip from 'adm-zip';

interface RestoreRequest {
    spaceId: string;
    backupId: string; // Changed from fileName
    targetEnvironment: string;
    clearEnvironment?: boolean;
    localeMapping?: Record<string, string>;
    options?: {
        locales?: string[];
        contentTypes?: string[];
        clearEnvironment?: boolean | string;
        includeAssets?: boolean;
    };
}

export const config = {
    api: {
        bodyParser: false, // Disable for formidable
    },
};

// Helper for formidable
const parseForm = (req: NextApiRequest, maxMB: number): Promise<{ fields: Fields; files: Files }> => {
    const form = new IncomingForm({
        maxFileSize: maxMB * 1024 * 1024, // Use maxMB for file size limit
        keepExtensions: true,
    });
    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                // Check for file size limit error specifically
                if (err.message.includes('maxFileSize exceeded')) {
                    reject(new Error(`File size limit exceeded. Max allowed: ${maxMB}MB.`, { cause: 413 }));
                } else {
                    reject(err);
                }
            }
            resolve({ fields, files });
        });
    });
};

import { filterBackupContent, cleanupBackupLocales, transformBackupLocales } from '@/utils/restore-helpers';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RestoreResponse>
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let fields: Record<string, string | string[] | undefined> = {};
    let files: Record<string, unknown> = {};
    let assetsDir: string | null = null;
    let tempZipPath: string | null = null;
    let tempFilePath: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userRecord: any = null;

    try {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
            const settings = await prisma.appSettings.findFirst();
            const maxMB = settings?.maxAssetSizeMB || 1024;
            const result = await parseForm(req, maxMB);
            fields = result.fields;
            files = result.files;

            const getValue = (val: string | string[] | undefined) => Array.isArray(val) ? val[0] : val;

            const spaceId = getValue(fields.spaceId);
            const backupId = getValue(fields.backupId);
            const targetEnvironment = getValue(fields.targetEnvironment);
            const localeMappingStr = getValue(fields.localeMapping);
            const optionsStr = getValue(fields.options);
            const backupContentStr = getValue(fields.backupContent);
            const fileName = getValue(fields.fileName);

            const localeMapping = localeMappingStr ? JSON.parse(localeMappingStr) : undefined;
            const options = optionsStr ? JSON.parse(optionsStr) : undefined;
            const backupContent = backupContentStr ? JSON.parse(backupContentStr) : undefined;

            fields = { spaceId, backupId, targetEnvironment, localeMapping, options, backupContent, fileName };

            const backupFile = Array.isArray(files.backupFile) ? files.backupFile[0] : files.backupFile;
            if (backupFile && backupFile.filepath) {
                const fileContent = fs.readFileSync(backupFile.filepath, 'utf8');
                fields.backupContent = JSON.parse(fileContent);
                if (!fields.fileName) fields.fileName = backupFile.originalFilename || backupFile.newFilename || 'local-backup.json';
            }

            const zipFile = Array.isArray(files.assetZip) ? files.assetZip[0] : files.assetZip;
            if (zipFile && zipFile.filepath) {
                const filePath = zipFile.filepath;
                tempZipPath = filePath;
                const zip = new AdmZip(filePath);
                const extractDir = path.join(process.cwd(), 'backups', 'tmp', `assets-${Date.now()}`);
                if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

                zip.extractAllTo(extractDir, true);
                assetsDir = extractDir;

                const assetsPath = path.join(extractDir, 'assets');
                if (fs.existsSync(assetsPath)) {
                    assetsDir = assetsPath;
                }
            }
        } else {
            // Manually parse JSON body since bodyParser is disabled
            const getRawBody = async (req: NextApiRequest): Promise<string> => {
                return new Promise((resolve, reject) => {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', () => resolve(body));
                    req.on('error', reject);
                });
            };
            const rawBody = await getRawBody(req);
            fields = rawBody ? JSON.parse(rawBody) : {};
        }

        const { spaceId, backupId, targetEnvironment, options, clearEnvironment, backupContent, localeMapping, fileName } = fields as unknown as RestoreRequest & { backupContent?: BackupData, fileName?: string };

        if (!spaceId || (!backupId && !backupContent) || !targetEnvironment) {
            return res.status(400).json({
                success: false,
                error: "Space ID, target environment, and either backup ID or backup content are required"
            });
        }

        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        userRecord = user;
        if (!user || !user.contentfulToken) {
            return res.status(401).json({ success: false, error: 'Contentful token not set in profile' });
        }
        const token = decrypt(user.contentfulToken);

        // --- SERVER-SIDE ASSET DETECTION ---
        // If includeAssets is true but no file was uploaded, check if server has it
        if (options?.includeAssets && !assetsDir && backupId) {
            const backup = await prisma.backupRecord.findFirst({
                where: { id: backupId, userId: user.id }
            });

            if (backup && (backup as unknown as { hasZip: boolean }).hasZip) {
                const zipName = backup.name.replace('.json', '-with-assets.zip');
                const serverZipPath = path.join(process.cwd(), 'backups', spaceId, zipName);

                if (fs.existsSync(serverZipPath)) {

                    const zip = new AdmZip(serverZipPath);
                    const extractDir = path.join(process.cwd(), 'backups', 'tmp', `assets-server-${Date.now()}`);
                    if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

                    zip.extractAllTo(extractDir, true);
                    assetsDir = extractDir;

                    const assetsPath = path.join(extractDir, 'assets');
                    if (fs.existsSync(assetsPath)) {
                        assetsDir = assetsPath;
                    }
                } else {
                    // File not found, continue without assets
                }
            }
        }
        // End server-side asset detection

        await logger.info('RESTORE_START', `Starting restore for space ${spaceId} to environment ${targetEnvironment}`, { backupId, includeAssets: !!assetsDir }, { id: user.id, email: user.email });

        const shouldClear = clearEnvironment || options?.clearEnvironment === true || options?.clearEnvironment === 'true';

        if (shouldClear) {
            const client = createClient({ accessToken: token });
            const space = await client.getSpace(spaceId);
            const environment = await space.getEnvironment(targetEnvironment);

            const deleteAll = async (type: 'Entry' | 'Asset' | 'ContentType') => {
                let hasItems = true;
                let skip = 0;
                let stuckCount = 0;

                while (hasItems && stuckCount < 5) { // Prevent infinite loops
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let items: any;
                    if (type === 'Entry') items = await environment.getEntries({ limit: 100, skip });
                    else if (type === 'Asset') items = await environment.getAssets({ limit: 100, skip });
                    else if (type === 'ContentType') items = await environment.getContentTypes({ limit: 100, skip });

                    if (!items?.items || items.items.length === 0) {
                        hasItems = false;
                        break;
                    }

                    let deletedInThisBatch = 0;

                    for (const item of items.items) {
                        try {
                            if (item.isPublished()) await item.unpublish();
                        } catch {
                            // Ignore unpublish errors
                        }
                        try {
                            await item.delete();
                            deletedInThisBatch++;
                        } catch {
                            // Ignore delete errors
                        }
                    }

                    if (deletedInThisBatch === 0 && items.items.length > 0) {
                        // We couldn't delete anything in this batch, try skipping them to see if others can be deleted
                        skip += items.items.length;
                        stuckCount++;
                    } else {
                        // Reset stuck count and skip if we made progress
                        stuckCount = 0;
                        skip = 0;
                    }

                    await new Promise(r => setTimeout(r, 1000)); // Respect rate limits
                }
            };

            await deleteAll('Entry');
            await deleteAll('Asset');
            await deleteAll('ContentType');
        }

        let contentToRestore: BackupData | undefined;
        if (backupContent) {
            contentToRestore = backupContent;
        } else {
            contentToRestore = (await BackupService.getBackupContent(backupId, userId)) as BackupData;
        }

        if (contentToRestore && options && (options.locales || options.contentTypes)) {
            contentToRestore = filterBackupContent(contentToRestore, options);
        }

        if (contentToRestore) {
            try {
                const targetLocales = await ContentfulManagement.getLocales(spaceId, targetEnvironment, token);
                const targetLocaleCodes = new Set<string>(targetLocales.map((l: BackupLocale) => l.code));

                if (localeMapping && Object.keys(localeMapping).length > 0) {
                    contentToRestore = transformBackupLocales(contentToRestore, localeMapping);
                    const mappedTargetCodes = new Set<string>(targetLocaleCodes);
                    Object.values(localeMapping).forEach(targetCode => mappedTargetCodes.add(targetCode));
                    contentToRestore = cleanupBackupLocales(contentToRestore!, mappedTargetCodes);
                } else {
                    const targetDefaultLocale = targetLocales.find((l: BackupLocale) => l.default)?.code;
                    const sourceDefaultLocale = contentToRestore.locales?.find((l: BackupLocale) => l.default)?.code;
                    if (targetDefaultLocale && sourceDefaultLocale && targetDefaultLocale !== sourceDefaultLocale) {
                        const autoMapping = { [sourceDefaultLocale]: targetDefaultLocale };
                        contentToRestore = transformBackupLocales(contentToRestore, autoMapping);
                    }
                    contentToRestore = cleanupBackupLocales(contentToRestore!, targetLocaleCodes);
                }
            } catch {
                // Continue without locale transformation on error
            }
        }

        const fileNameSafe = (fileName || backupId || 'restore-fallback').replace(/[^a-zA-Z0-9-_]/g, '_');
        const tempFileName = `temp-restore-${Date.now()}-${fileNameSafe}.json`;
        const backupDir = path.join(process.cwd(), 'backups', spaceId);
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const tempBackupPath = path.join(backupDir, tempFileName);
        fs.writeFileSync(tempBackupPath, JSON.stringify(contentToRestore, null, 2));
        tempFilePath = tempBackupPath;

        await ContentfulCLI.restoreBackup(
            spaceId,
            tempFileName,
            targetEnvironment,
            token,
            (msg) => console.log(`[RESTORE CLI] ${msg}`),
            false,
            assetsDir || undefined
        );

        await logger.info('RESTORE_SUCCESS', `Successfully restored to ${targetEnvironment} in space ${spaceId}`, { spaceId, targetEnvironment }, { id: user.id, email: user.email });
        return res.status(200).json({ success: true, data: {} });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to restore backup';

        // Capture detailed CLI error log if it exists
        const cliErrorContent = await logger.captureCliError();

        if (userRecord) {
            await logger.error('RESTORE_ERROR', `Failed restore: ${errorMessage}`, { error, fields, cliErrorLog: cliErrorContent ? JSON.parse(cliErrorContent) : undefined }, { id: userRecord.id, email: userRecord.email });
        }
        return res.status(500).json({ success: false, error: errorMessage, details: cliErrorContent });
    } finally {
        // CLEANUP EVERYTHING
        try {
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            if (tempZipPath && fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
            if (assetsDir) {
                // Determine the root extract dir (assetsDir might be extractDir/assets)
                const extractDir = assetsDir.includes('tmp') ?
                    (assetsDir.endsWith('assets') ? path.dirname(assetsDir) : assetsDir) :
                    null;
                if (extractDir && fs.existsSync(extractDir)) {
                    fs.rmSync(extractDir, { recursive: true, force: true });
                }
            }
        } catch {
            // Ignore cleanup errors
        }
    }
}
