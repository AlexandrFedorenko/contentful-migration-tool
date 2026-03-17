/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';
import { Backup } from '@/types/backup';
import AdmZip from 'adm-zip';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export class BackupService {
  /**
   * Get max backups per user from AppSettings (default: 1)
   */
  private static async getMaxBackupsPerUser(): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = await prisma.appSettings.findFirst() as any;
    return settings?.maxBackupsPerUser ?? 1;
  }

  /**
   * Helper to resolve Clerk ID to local User ID
   */
  private static async resolveUserId(clerkId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new Error(`User not found for Clerk ID: ${clerkId}`);
    return user.id;
  }

  /**
   * Helper to get local backup directory path
   */
  private static getBackupDir(spaceId: string): string {
    return path.join(process.cwd(), 'backups', spaceId);
  }

  /**
   * Helper to transform JSON filename to asset ZIP filename
   */
  private static getZipName(jsonName: string): string {
    return jsonName.replace('.json', '-with-assets.zip');
  }

  /**
   * Retrieves all backups for a specific space and user.
   * Checks the physical disk presence for each backup and returns a validated list.
   *
   * @param spaceId - Contentful Space ID
   * @param clerkId - Clerk User ID
   * @returns Array of validated Backup objects
   */
  static async getBackups(spaceId: string, clerkId: string): Promise<Backup[]> {
    try {
      const userId = await this.resolveUserId(clerkId);
      const backups = await prisma.backupRecord.findMany({
        where: { spaceId, userId, type: 'LOCAL_DB' },
        orderBy: { createdAt: 'desc' }
      });

      const backupDir = this.getBackupDir(spaceId);

      return backups.map(backup => {
        const zipPath = path.join(backupDir, this.getZipName(backup.name));
        const physicalHasZip = fs.existsSync(zipPath);

        return {
          name: backup.name,
          path: '',
          time: backup.createdAt.getTime(),
          id: backup.id,
          hasZip: !!(backup as any).hasZip && physicalHasZip
        };
      });
    } catch (error) {
      console.error('Failed to get backups:', error);
      return [];
    }
  }

  /**
   * Enforces the user's backup storage limits by optionally deleting older backups.
   * If limits are exceeded and overwrite is not allowed, throws a specific error.
   * Limits are configurable per user/tier in AppSettings (default max: 10).
   *
   * @param spaceId - Contentful Space ID
   * @param clerkId - Clerk User ID
   * @param overwrite - If true, automatically deletes the oldest backup to make room
   * @param isAssetBackup - If true, verifies limits against zip storage limits
   * @throws Error if limits are reached and `overwrite` is false
   */
  static async checkBackupLimit(spaceId: string, clerkId: string, overwrite = false, isAssetBackup = false): Promise<void> {
    const userId = await this.resolveUserId(clerkId);
    const maxBackups = await this.getMaxBackupsPerUser();

    // Limits: 
    // - Asset Backups (with ZIP): Strict limit from settings (default 1)
    // - JSON Backups (no ZIP): Higher limit (hardcoded or derived) to allow history

    const MAX_JSON_BACKUPS = 100;

    if (isAssetBackup) {
      // Check limit for HEAVY backups
      // IMPORTANT: We must verify physical existence because cleanup jobs might delete ZIPs
      // without updating the DB immediately. We need to sync the state here.

      const potentialZipBackups = await prisma.backupRecord.findMany({
        where: { userId, hasZip: true }
      });

      let realZipCount = 0;

      for (const backup of potentialZipBackups) {
        const zipName = this.getZipName(backup.name);
        const zipPath = path.join(this.getBackupDir(backup.spaceId), zipName);

        if (fs.existsSync(zipPath)) {
          realZipCount++;
        } else {
          // File is missing, update DB to reflect reality
          console.warn(`[CheckLimit] ZIP file missing for ${backup.id}, updating DB.`);
          await prisma.backupRecord.update({
            where: { id: backup.id },
            data: { hasZip: false }
          });
        }
      }

      if (realZipCount >= maxBackups) {
        if (overwrite) {
          // Delete ONLY the oldest ASSET backup to make room
          await this.downgradeOldestAssetBackup(userId);
        } else {
          throw new Error(`BACKUP_LIMIT_REACHED:${realZipCount}:${maxBackups}`);
        }
      }
    } else {
      // Check limit for LIGHT backups (JSON only)
      // We count ALL backups towards this purely to prevent infinite spam, but the limit is higher
      const totalCount = await prisma.backupRecord.count({ where: { userId } });

      if (totalCount >= MAX_JSON_BACKUPS) {
        // Auto-rotate: Delete the oldest backup to make room silently.
        // We do NOT want to show the overwrite dialog for JSON backups (user request).
        await this.deleteOldestBackup(userId, false);
      }
    }
  }

  /**
   * Downgrade the oldest ASSET backup to a regular JSON backup
   * (Removes zip file, updates DB, keeps JSON content)
   */
  static async downgradeOldestAssetBackup(userId: string): Promise<void> {
    const oldest = await prisma.backupRecord.findFirst({
      where: { userId, type: 'LOCAL_DB', hasZip: true },
      orderBy: { createdAt: 'asc' }
    });

    if (oldest) {
      // Cleanup physical ZIP
      const zipPath = path.join(this.getBackupDir(oldest.spaceId), this.getZipName(oldest.name));
      if (fs.existsSync(zipPath)) {
        try { fs.unlinkSync(zipPath); } catch { /* ignore */ }
      }

      // Update record to remove 'hasZip' flag
      await prisma.backupRecord.update({
        where: { id: oldest.id },
        data: { hasZip: false }
      });
    }
  }

  /**
   * Delete the oldest backup to make room
   */
  static async deleteOldestBackup(userId: string, onlyWithZip: boolean): Promise<void> {
    const oldest = await prisma.backupRecord.findFirst({
      where: {
        userId,
        type: 'LOCAL_DB',
        ...(onlyWithZip ? { hasZip: true } : {})
      },
      orderBy: { createdAt: 'asc' }
    });

    if (oldest) {
      // Cleanup physical ZIP if it exists
      const zipPath = path.join(this.getBackupDir(oldest.spaceId), this.getZipName(oldest.name));
      if (fs.existsSync(zipPath)) {
        try { fs.unlinkSync(zipPath); } catch { /* ignore */ }
      }
      await prisma.backupRecord.delete({ where: { id: oldest.id } });
    }
  }

  /**
   * @deprecated Use deleteOldestBackup instead
   */
  static async deleteAllUserBackups(clerkId: string): Promise<number> {
    // Keeping for backward compatibility if needed, but logic is replaced by deleteOldestBackup
    const userId = await this.resolveUserId(clerkId);
    return (await prisma.backupRecord.deleteMany({ where: { userId, type: 'LOCAL_DB' } })).count;
  }

  /**
   * Saves metadata and content of a newly created backup into the database.
   * Overwrites if a backup with the same filename already exists.
   *
   * @param clerkId - Clerk User ID
   * @param spaceId - Contentful Space ID
   * @param fileName - Name of the JSON backup file
   * @param content - The parsed backup JSON content
   * @param hasZip - Boolean flag indicating if an associated asset ZIP archive exists
   * @returns The created Prisma BackupRecord object
   */
  static async saveBackupToDb(
    clerkId: string,
    spaceId: string,
    fileName: string,
    content: unknown,
    hasZip: boolean = false
  ): Promise<Backup & { id: string }> {
    const userId = await this.resolveUserId(clerkId);
    const backup = await prisma.backupRecord.create({
      data: {
        name: fileName,
        spaceId,
        userId,
        type: 'LOCAL_DB',
        content: content as Prisma.InputJsonValue,
        hasZip,
        description: `Backup for space ${spaceId}`
      }
    });

    return {
      name: backup.name,
      path: '',
      time: backup.createdAt.getTime(),
      id: backup.id,
      hasZip: !!backup.hasZip
    };
  }

  static async getBackupContent(backupId: string, clerkId: string): Promise<unknown> {
    const userId = await this.resolveUserId(clerkId);
    const backup = await prisma.backupRecord.findFirst({
      where: { id: backupId, userId }
    });

    if (!backup || !backup.content) throw new Error('Backup not found or empty');
    return backup.content;
  }

  static async deleteBackup(backupId: string, clerkId: string): Promise<boolean> {
    const userId = await this.resolveUserId(clerkId);
    const backup = await prisma.backupRecord.findFirst({
      where: { id: backupId, userId }
    });

    if (!backup) return false;

    // Cleanup physical ZIP if it exists
    const zipPath = path.join(this.getBackupDir(backup.spaceId), this.getZipName(backup.name));
    if (fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath);
      } catch (err) {
        console.error("Archive cleanup failed:", err);
      }
    }

    await prisma.backupRecord.delete({ where: { id: backupId } });
    return true;
  }

  static async getTotalBackupsCount(clerkId: string): Promise<number> {
    try {
      const userId = await this.resolveUserId(clerkId);
      return await prisma.backupRecord.count({ where: { userId } });
    } catch {
      return 0;
    }
  }

  static async createBackupZip(spaceId: string, clerkId: string): Promise<Buffer> {
    const userId = await this.resolveUserId(clerkId);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { userId, type: 'LOCAL_DB' };
    if (spaceId !== 'all') {
      whereClause.spaceId = spaceId;
    }

    const backups = await prisma.backupRecord.findMany({
      where: whereClause
    });

    if (backups.length === 0) throw new Error('No backups found');

    const zip = new AdmZip();
    backups.forEach(backup => {
      if (backup.content) {
        zip.addFile(backup.name, Buffer.from(JSON.stringify(backup.content, null, 2), "utf8"));
      }
    });

    return zip.toBuffer();
  }

  static async renameBackup(spaceId: string, clerkId: string, oldFileName: string, newFileName: string): Promise<void> {
    const userId = await this.resolveUserId(clerkId);

    const existing = await prisma.backupRecord.findFirst({
      where: { spaceId, userId, name: newFileName, type: 'LOCAL_DB' }
    });
    if (existing) throw new Error('A backup with this name already exists');

    const backup = await prisma.backupRecord.findFirst({
      where: { spaceId, userId, name: oldFileName, type: 'LOCAL_DB' }
    });
    if (!backup) throw new Error('Backup not found');

    // Rename physical ZIP file if it exists
    const oldZipName = this.getZipName(oldFileName);
    const newZipName = this.getZipName(newFileName);
    const backupDir = this.getBackupDir(spaceId);

    const oldZipPath = path.join(backupDir, oldZipName);
    const newZipPath = path.join(backupDir, newZipName);

    if (fs.existsSync(oldZipPath)) {
      try {
        fs.renameSync(oldZipPath, newZipPath);
      } catch {
        // Proceed with DB update even if file rename fails
      }
    }

    await prisma.backupRecord.update({
      where: { id: backup.id },
      data: { name: newFileName }
    });
  }
}