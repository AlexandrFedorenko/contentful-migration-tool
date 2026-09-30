import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { getActiveToken } from '@/server/contentful/credentials';
import { environmentId, spaceId } from '@/server/validation';
import { BackupService } from '@/utils/backup-service';
import { ContentfulManagement } from '@/utils/contentful-management';
import type { Locale } from '@/types/common';
import type { BackupData } from '@/types/backup';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

const Body = z.object({
    spaceId,
    targetEnvironment: environmentId,
    backupId: z.string().uuid().optional(),
    /** Only the locales array of an uploaded export is needed here. */
    backupContent: z.object({ locales: z.array(z.object({ code: z.string(), name: z.string().optional(), default: z.boolean().optional() }).passthrough()).optional() }).passthrough().optional(),
    options: z.object({ locales: z.array(z.string()).optional() }).passthrough().optional(),
}).passthrough();

/**
 * POST /api/validate-restore — compare backup locales with the target environment
 * so the UI can ask for a locale mapping before restoring.
 */
export default createApiHandler({
    POST: route({
        body: Body,
        rateLimit: { limit: 30, windowSeconds: 60 },
        handler: async (_req, _res, { user, body }) => {
            let backupLocales: Locale[] = [];
            if (body.backupContent) {
                backupLocales = (body.backupContent.locales ?? []) as Locale[];
            } else if (body.backupId) {
                backupLocales = (((await BackupService.getBackupContent(body.backupId, user.id)) as BackupData).locales ?? []) as Locale[];
            }

            const token = await getActiveToken(user.id);
            const targetLocales: Locale[] = (await ContentfulManagement.getLocales(body.spaceId, body.targetEnvironment, token))
                .map((l: Locale) => ({ code: l.code, default: l.default, name: l.name }));

            let sourceLocales = backupLocales.map((l) => ({ code: l.code, default: l.default, name: l.name }));
            if (body.options?.locales?.length) {
                const selected = new Set(body.options.locales);
                sourceLocales = sourceLocales.filter((l) => selected.has(l.code));
            }

            const sourceDefault = sourceLocales.find((l) => l.default);
            const targetDefault = targetLocales.find((l) => l.default);
            const defaultMismatch = sourceDefault ? sourceDefault.code !== targetDefault?.code : false;
            const targetCodes = new Set(targetLocales.map((l) => l.code));
            const missingInTarget = sourceLocales.filter((l) => !targetCodes.has(l.code)).map((l) => l.code);

            return {
                status: defaultMismatch || missingInTarget.length > 0 ? 'mismatch' : 'ok',
                sourceLocales,
                targetLocales,
                details: { defaultMismatch, missingInTarget },
            };
        },
    }),
});
