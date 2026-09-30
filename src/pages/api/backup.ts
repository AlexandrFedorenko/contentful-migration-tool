import { createApiHandler, route } from '@/server/api';
import { HttpError } from '@/server/http-error';
import { BackupParams } from '@/server/jobs/schemas';
import { enqueueJob } from '@/server/jobs/queue';
import { awaitJob } from '@/server/jobs/sse';
import { BackupService } from '@/utils/backup-service';

/**
 * POST /api/backup { spaceId, env, includeAssets, includeDrafts, includeArchived, overwrite }
 * Runs the export as a background job and responds when it finishes.
 * Responds 409 when the asset-backup quota is reached and `overwrite` is not set.
 */
export default createApiHandler({
    POST: route({
        body: BackupParams,
        rateLimit: { limit: 10, windowSeconds: 60, bucket: 'jobs' },
        handler: async (req, res, { user, body }) => {
            if (body.includeAssets) {
                try {
                    await BackupService.checkBackupLimit(body.spaceId, user.id, false, true);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : '';
                    if (!msg.startsWith('BACKUP_LIMIT_REACHED:') || body.overwrite) {
                        if (!msg.startsWith('BACKUP_LIMIT_REACHED:')) throw err;
                    } else {
                        const [, count, max] = msg.split(':');
                        res.status(409).json({
                            success: false,
                            error: `You already have ${count} backup(s) with assets. Maximum allowed: ${max}. Use overwrite to replace.`,
                            data: { limitReached: true, currentCount: Number(count), maxAllowed: Number(max) },
                        });
                        return;
                    }
                }
            }

            const jobId = await enqueueJob(user.id, 'backup', body);
            res.setHeader('X-Job-Id', jobId);
            const end = await awaitJob(req, jobId);
            if (!end) return; // client disconnected; the job keeps running
            if (end.status !== 'SUCCEEDED') throw new HttpError(500, 'BACKUP_FAILED', end.error || 'Backup failed');
            return end.result;
        },
    }),
});
