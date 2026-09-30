import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { notFound } from '@/server/http-error';
import * as storage from '@/server/storage';
import { BackupService } from '@/utils/backup-service';

export const config = { api: { responseLimit: false } };

function attachmentName(name: string, ext: string): string {
    const base = name.replace(/\.json$/i, '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'backup';
    return `${base}${ext}`;
}

/**
 * GET /api/download-backup?backupId=&format=json|zip
 * Streams a backup owned by the current user (JSON export or asset archive).
 */
export default createApiHandler({
    GET: route({
        query: z.object({ backupId: z.string().uuid(), format: z.enum(['json', 'zip']).default('json') }),
        rateLimit: { limit: 60, windowSeconds: 60 },
        handler: async (_req, res, { user, query }) => {
            const backup = await BackupService.getBackupRecord(query.backupId, user.id);
            res.setHeader('Cache-Control', 'private, no-store');

            if (query.format === 'zip') {
                const key = storage.keys.archive(user.id, backup.id);
                const size = await storage.fileSize(key);
                if (!backup.hasZip || size === null) throw notFound('Asset archive');
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Length', String(size));
                res.setHeader('Content-Disposition', `attachment; filename="${attachmentName(backup.name, '-with-assets.zip')}"`);
                await new Promise<void>((resolve, reject) => {
                    storage.createReadStream(key).on('error', reject).pipe(res).on('finish', resolve);
                });
                return;
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${attachmentName(backup.name, '.json')}"`);
            if (backup.storageKey) {
                await new Promise<void>((resolve, reject) => {
                    storage.createJsonGzReadStream(storage.keys.backup(user.id, backup.id)).on('error', reject).pipe(res).on('finish', resolve);
                });
                return;
            }
            if (!backup.content) throw notFound('Backup content');
            res.status(200).send(JSON.stringify(backup.content));
        },
    }),
});
