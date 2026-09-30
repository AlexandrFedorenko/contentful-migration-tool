import { z } from 'zod';
import { environmentId, localeCode, resourceId, spaceId } from '@/server/validation';
import { MigrationStepsSchema } from '@/server/visual-migration';

/**
 * Validated parameters of every job type. Kept free of heavy imports so the web
 * process can validate requests without loading the job implementations.
 */

/** Files uploaded for a restore job live in DATA_DIR/uploads/<userId>/<uploadId>/ */
export const UPLOAD_CONTENT_FILE = 'content.json';
export const UPLOAD_ASSETS_FILE = 'assets.zip';

export const BackupParams = z.object({
    spaceId,
    env: environmentId,
    includeAssets: z.boolean().default(false),
    includeDrafts: z.boolean().default(true),
    includeArchived: z.boolean().default(true),
    /** Replace the oldest asset archive when the per-user limit is reached. */
    overwrite: z.boolean().default(false),
});
export type BackupParams = z.infer<typeof BackupParams>;

export const RestoreParams = z.object({
    spaceId,
    targetEnvironment: environmentId,
    /** A stored backup of this user... */
    backupId: z.string().uuid().optional(),
    /** ...or files uploaded for this job (see src/pages/api/restore.ts). */
    uploadId: z.string().uuid().optional(),
    fileName: z.string().max(200).optional(),
    localeMapping: z.record(localeCode, localeCode).optional(),
    options: z.object({
        locales: z.array(localeCode).max(200).optional(),
        contentTypes: z.array(resourceId).max(1000).optional(),
        clearEnvironment: z.union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')]).optional(),
        includeAssets: z.boolean().optional(),
    }).default({}),
}).refine((p) => Boolean(p.backupId) !== Boolean(p.uploadId), { message: 'Provide either backupId or an uploaded file' });
export type RestoreParams = z.infer<typeof RestoreParams>;

export const LiveSyncParams = z.object({
    sourceSpaceId: spaceId,
    sourceEnvironmentId: environmentId,
    targetSpaceId: spaceId,
    targetEnvironmentId: environmentId,
    selectedContentTypeIds: z.array(resourceId).min(1).max(1000),
    selectedEntryIds: z.array(resourceId).max(50_000).default([]),
    selectedLocales: z.array(localeCode).max(200).default([]),
    localeMapping: z.record(localeCode, localeCode).default({}),
    options: z.object({
        clearEnvironment: z.boolean().default(false),
        includeAssets: z.boolean().default(false),
        mergeMode: z.enum(['upsert', 'skip-existing']).default('upsert'),
    }).default({ clearEnvironment: false, includeAssets: false, mergeMode: 'upsert' }),
}).refine((p) => p.sourceSpaceId !== p.targetSpaceId || p.sourceEnvironmentId !== p.targetEnvironmentId, {
    message: 'Source and target must differ',
});
export type LiveSyncParams = z.infer<typeof LiveSyncParams>;

export const VisualMigrationParams = z.object({
    spaceId,
    environmentId,
    steps: MigrationStepsSchema,
});
export type VisualMigrationParams = z.infer<typeof VisualMigrationParams>;
