import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { Backup } from '@/types/backup';
import { HttpError, notFound } from '@/server/http-error';
import * as storage from '@/server/storage';

/** JSON-only backups kept per user before the oldest one is rotated out. */
const MAX_JSON_BACKUPS = 100;

/**
 * Backup metadata lives in Postgres; the export itself is a gzipped file in storage
 * (DATA_DIR/backups/<userId>/<backupId>.json.gz). Older rows may still carry the export
 * inline in `content` and are read transparently.
 *
 * All methods take the internal User.id and always scope queries by it.
 */
export class BackupService {
  private static async maxAssetBackups(): Promise<number> {
    const settings = await prisma.appSettings.findFirst({ select: { maxBackupsPerUser: true } });
    return settings?.maxBackupsPerUser ?? 1;
  }

  static async getBackups(spaceId: string, userId: string): Promise<Backup[]> {
    const backups = await prisma.backupRecord.findMany({
      where: { spaceId, userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, hasZip: true, sizeBytes: true, environmentId: true },
    });
    return backups.map((b) => ({
      id: b.id,
      name: b.name,
      path: '',
      time: b.createdAt.getTime(),
      hasZip: b.hasZip,
      sizeBytes: b.sizeBytes !== null ? Number(b.sizeBytes) : undefined,
      environmentId: b.environmentId ?? undefined,
    }));
  }

  /**
   * Enforce storage quotas before a new backup is created.
   * Asset backups are limited by AppSettings.maxBackupsPerUser; with `overwrite` the oldest
   * archive is dropped (its JSON export is kept). JSON backups rotate silently.
   */
  static async checkBackupLimit(_spaceId: string, userId: string, overwrite = false, isAssetBackup = false): Promise<void> {
    if (isAssetBackup) {
      const max = await this.maxAssetBackups();
      const count = await prisma.backupRecord.count({ where: { userId, hasZip: true } });
      if (count >= max) {
        if (!overwrite) throw new Error(`BACKUP_LIMIT_REACHED:${count}:${max}`);
        const oldest = await prisma.backupRecord.findFirst({ where: { userId, hasZip: true }, orderBy: { createdAt: 'asc' } });
        if (oldest) {
          await storage.remove(storage.keys.archive(userId, oldest.id));
          await prisma.backupRecord.update({ where: { id: oldest.id }, data: { hasZip: false } });
        }
      }
      return;
    }
    const total = await prisma.backupRecord.count({ where: { userId } });
    if (total >= MAX_JSON_BACKUPS) {
      const oldest = await prisma.backupRecord.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
      if (oldest) await this.deleteBackup(oldest.id, userId);
    }
  }

  /** Persist a new backup: export content to storage, metadata to the database. */
  static async saveBackup(input: {
    userId: string;
    spaceId: string;
    environmentId: string;
    name: string;
    content: unknown;
    stats?: Record<string, number>;
  }): Promise<{ id: string; name: string }> {
    const record = await prisma.backupRecord.create({
      data: {
        userId: input.userId,
        spaceId: input.spaceId,
        environmentId: input.environmentId,
        name: input.name,
        type: 'LOCAL_DB',
        description: `Backup of ${input.spaceId}/${input.environmentId}`,
        stats: input.stats as Prisma.InputJsonValue | undefined,
      },
    });
    try {
      const size = await storage.writeJsonGz(storage.keys.backup(input.userId, record.id), input.content);
      await prisma.backupRecord.update({
        where: { id: record.id },
        data: { storageKey: storage.keys.backup(input.userId, record.id).join('/'), sizeBytes: BigInt(size) },
      });
    } catch (error) {
      await prisma.backupRecord.delete({ where: { id: record.id } }).catch(() => undefined);
      throw error;
    }
    return { id: record.id, name: record.name };
  }

  static async getBackupRecord(backupId: string, userId: string) {
    const backup = await prisma.backupRecord.findFirst({ where: { id: backupId, userId } });
    if (!backup) throw notFound('Backup');
    return backup;
  }

  static async getBackupContent(backupId: string, userId: string): Promise<unknown> {
    const backup = await this.getBackupRecord(backupId, userId);
    if (backup.storageKey) return storage.readJsonGz(storage.keys.backup(userId, backup.id));
    if (backup.content) return backup.content;
    throw new HttpError(404, 'BACKUP_EMPTY', 'Backup content is missing');
  }

  /** Same as getBackupContent but looks the backup up by space and file name (legacy preview URLs). */
  static async getBackupContentByName(spaceId: string, name: string, userId: string): Promise<unknown> {
    const backup = await prisma.backupRecord.findFirst({ where: { spaceId, name, userId }, select: { id: true } });
    if (!backup) throw notFound('Backup');
    return this.getBackupContent(backup.id, userId);
  }

  static async deleteBackup(backupId: string, userId: string): Promise<boolean> {
    const backup = await prisma.backupRecord.findFirst({ where: { id: backupId, userId }, select: { id: true } });
    if (!backup) return false;
    await prisma.backupRecord.delete({ where: { id: backup.id } });
    await Promise.all([
      storage.remove(storage.keys.backup(userId, backup.id)),
      storage.remove(storage.keys.archive(userId, backup.id)),
    ]);
    return true;
  }

  /** Remove every file that belongs to a user (account deletion). */
  static async purgeUserFiles(userId: string): Promise<void> {
    await Promise.all([
      storage.remove(['backups', userId]),
      storage.remove(['archives', userId]),
      storage.remove(storage.keys.uploadDir(userId)),
    ]);
  }

  static async getTotalBackupsCount(userId: string): Promise<number> {
    return prisma.backupRecord.count({ where: { userId } });
  }

  static async renameBackup(spaceId: string, userId: string, oldFileName: string, newFileName: string): Promise<void> {
    const clash = await prisma.backupRecord.findFirst({ where: { spaceId, userId, name: newFileName }, select: { id: true } });
    if (clash) throw new HttpError(409, 'NAME_TAKEN', 'A backup with this name already exists');
    const backup = await prisma.backupRecord.findFirst({ where: { spaceId, userId, name: oldFileName }, select: { id: true } });
    if (!backup) throw notFound('Backup');
    await prisma.backupRecord.update({ where: { id: backup.id }, data: { name: newFileName } });
  }
}
