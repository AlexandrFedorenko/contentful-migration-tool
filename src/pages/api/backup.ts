import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulCLI } from '@/utils/contentful-cli';
import { ContentfulManagement } from '@/utils/contentful-management';
import { BackupService } from '@/utils/backup-service'; // Import BackupService
import { BackupResponse } from '@/types/api';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from "@/utils/logger";
import AdmZip from 'adm-zip';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BackupResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { spaceId, env, includeAssets, includeDrafts, includeArchived, overwrite } = req.body;

  if (!spaceId || !env) {
    return res.status(400).json({
      success: false,
      error: 'Space ID and environment are required'
    });
  }

  let backupFilePath: string | undefined;
  let userRecord: { id: string; email: string; contentfulToken: string | null } | null = null;
  let assetZipCreated = false;

  try {
    userRecord = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!userRecord || !userRecord.contentfulToken) {
      return res.status(401).json({ success: false, error: 'Contentful token not set in profile' });
    }

    // Check backup limit — if overwrite=true, delete existing backups first
    try {
      await BackupService.checkBackupLimit(spaceId, userId, !!overwrite, !!includeAssets);
    } catch (limitErr) {
      const msg = limitErr instanceof Error ? limitErr.message : '';
      if (msg.startsWith('BACKUP_LIMIT_REACHED:')) {
        const [, count, max] = msg.split(':');
        return res.status(409).json({
          success: false,
          error: `You already have ${count} backup(s). Maximum allowed: ${max}. Use overwrite to replace.`,
          data: { limitReached: true, currentCount: parseInt(count), maxAllowed: parseInt(max) }
        } as unknown as BackupResponse);
      }
      throw limitErr;
    }

    const token = decrypt(userRecord.contentfulToken);

    const space = await ContentfulManagement.getSpace(spaceId, token);
    const spaceName = space?.name || spaceId;

    // 1. Create backup with temporary path support

    const result = await ContentfulCLI.createBackup(
      spaceId,
      env,
      spaceName,
      token,
      (msg) => console.log(`[CLI] ${msg}`),
      !!includeAssets,
      includeDrafts !== false, // Default to true if undefined
      includeArchived !== false // Default to true if undefined
    );

    if (result.success && result.backupFile) {
      backupFilePath = path.join(process.cwd(), 'backups', spaceId, result.backupFile);

      // 2. Validate the created file
      if (!fs.existsSync(backupFilePath)) {
        throw new Error('Backup file was not created by CLI');
      }

      const fileContent = fs.readFileSync(backupFilePath, 'utf-8');
      let backupJson;
      try {
        backupJson = JSON.parse(fileContent);
        if (!backupJson.entries && !backupJson.contentTypes) {
          throw new Error('Backup file appeared empty or invalid');
        }
      } catch {
        throw new Error('Created backup file is not valid JSON or is corrupted');
      }

      // Calculate stats
      const stats = {
        entries: backupJson.entries?.length || 0,
        assets: backupJson.assets?.length || 0,
        contentTypes: backupJson.contentTypes?.length || 0,
        locales: backupJson.locales?.length || 0,
      };

      const savedBackup = await BackupService.saveBackupToDb(userId, spaceId, result.backupFile, backupJson, !!includeAssets);

      // --- GRACE PERIOD CLEANUP ---
      // Regularly cleanup old ZIP files (older than 30 minutes) to save space
      try {
        const backupsDir = path.join(process.cwd(), 'backups');
        if (fs.existsSync(backupsDir)) {
          const spaceDirs = fs.readdirSync(backupsDir);
          const now = Date.now();
          const THIRTY_MINUTES = 30 * 60 * 1000;

          for (const sDir of spaceDirs) {
            const fullSpacePath = path.join(backupsDir, sDir);
            if (!fs.statSync(fullSpacePath).isDirectory()) continue;

            const files = fs.readdirSync(fullSpacePath);
            for (const file of files) {
              if (file.endsWith('.zip')) {
                const filePath = path.join(fullSpacePath, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > THIRTY_MINUTES) {
                  fs.unlinkSync(filePath);
                  await logger.info(
                    'CLEANUP_EXPIRED',
                    `Purged expired transient archive: ${file}`,
                    { spaceId, file },
                    userRecord ? { id: userRecord.id, email: userRecord.email } : undefined
                  );
                }
              }
            }
          }
        }
      } catch {
        // Ignore cleanup errors
      }
      // ----------------------------

      // 4. Handle Assets Zipping if requested
      const rootAssetsFolder = path.join(process.cwd(), 'images.ctfassets.net');
      const hasAssetsInRoot = fs.existsSync(rootAssetsFolder);
      const hasAssetsInPath = result.assetsPath && fs.existsSync(result.assetsPath);

      if (includeAssets && (hasAssetsInRoot || hasAssetsInPath)) {
        try {
          const zip = new AdmZip();
          if (backupFilePath && fs.existsSync(backupFilePath)) {
            zip.addLocalFile(backupFilePath);
          }

          // Check if assets folder is in the path provided by CLI utility
          if (hasAssetsInPath && fs.readdirSync(result.assetsPath!).length > 0) {
            zip.addLocalFolder(result.assetsPath!, 'assets');
          }
          // Check if assets folder is in the root (where CLI often puts it)
          else if (hasAssetsInRoot && fs.readdirSync(rootAssetsFolder).length > 0) {
            zip.addLocalFolder(rootAssetsFolder, 'assets');
          }

          const zipName = result.backupFile.replace('.json', '-with-assets.zip');
          const zipPath = path.join(process.cwd(), 'backups', spaceId, zipName);

          zip.writeZip(zipPath);

          if (!fs.existsSync(zipPath)) {
            throw new Error(`Failed to verify ZIP creation at ${zipPath}`);
          }

          assetZipCreated = true;

          // Get dynamic limit from settings
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const settings = await prisma.appSettings.findFirst() as any;
          const maxMB = settings?.maxAssetSizeMB || 1024;
          const maxBytes = maxMB * 1024 * 1024;

          const zipStats = fs.statSync(zipPath);
          if (zipStats.size > maxBytes) {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            throw new Error(`Asset archive exceeds ${maxMB} MB limit. Process aborted to save server space.`);
          }

          await logger.info(
            'BACKUP_ASSET_ARCHIVE',
            `Created asset archive: ${zipName} (${(zipStats.size / 1024 / 1024).toFixed(2)} MB)`,
            { spaceId, env, zipName, sizeMB: (zipStats.size / 1024 / 1024).toFixed(2) },
            userRecord ? { id: userRecord.id, email: userRecord.email } : undefined
          );

          // Cleanup process-local assets folder
          if (result.assetsPath && fs.existsSync(result.assetsPath)) {
            fs.rmSync(result.assetsPath, { recursive: true, force: true });
          }
        } catch {
          // Ignore asset zip creation errors
        }
      }

      // 5. GLOBAL CLEANUP: Remove ANY local folders or files left behind
      // CLI folder is often created in root
      const cliRootFolder = path.join(process.cwd(), 'images.ctfassets.net');
      if (fs.existsSync(cliRootFolder)) {
        try {
          fs.rmSync(cliRootFolder, { recursive: true, force: true });
          await logger.info(
            'CLEANUP_TEMP',
            `Cleaned up Contentful CLI root folder: ${cliRootFolder}`,
            { spaceId },
            userRecord ? { id: userRecord.id, email: userRecord.email } : undefined
          );
        } catch {
          // Ignore cleanup errors
        }
      }

      if (backupFilePath && fs.existsSync(backupFilePath)) {
        try {
          fs.unlinkSync(backupFilePath);
          await logger.info(
            'CLEANUP_TEMP',
            `Successfully moved backup to DB and removed local file: ${result.backupFile}`,
            { spaceId, env, fileName: result.backupFile },
            userRecord ? { id: userRecord.id, email: userRecord.email } : undefined
          );
        } catch {
          // Ignore cleanup errors
        }
      }

      // Log success with stats
      await logger.info(
        'BACKUP_CREATE',
        `Backup created successfully: ${result.backupFile} ${assetZipCreated ? '(with assets archive)' : ''}`,
        { spaceId, env, fileName: result.backupFile, stats },
        { id: userRecord.id, email: userRecord.email }
      );

      return res.status(200).json({
        success: true,
        data: {
          backupFile: result.backupFile,
          hasZip: assetZipCreated,
          backupId: savedBackup.id // Return the ID
        }
      });
    } else {
      throw new Error('Failed to create backup via CLI');
    }

  } catch (error) {
    // Capture detailed CLI error log if it exists and merge into details
    const cliErrorContent = await logger.captureCliError();

    // Log error to DB
    await logger.error(
      'BACKUP_CREATE',
      `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { spaceId, env, error, cliErrorLog: cliErrorContent ? JSON.parse(cliErrorContent) : undefined },
      userRecord ? { id: userRecord.id, email: userRecord.email } : undefined
    );

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create backup'
    });
  }
}
