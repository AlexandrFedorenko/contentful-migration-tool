import fsp from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import type runContentfulImportType from 'contentful-import';
import { prisma } from '@/lib/db';
import { getActiveToken } from '@/server/contentful/credentials';
import { HttpError } from '@/server/http-error';
import * as storage from '@/server/storage';
import { resolveInside } from '@/server/validation';
import { BackupService } from '@/utils/backup-service';
import { ContentfulManagement } from '@/utils/contentful-management';
import { cleanupBackupLocales, filterBackupContent, transformBackupLocales } from '@/utils/restore-helpers';
import type { BackupData, BackupLocale } from '@/types/backup';
import type { JobContext } from '../context';
import { UPLOAD_ASSETS_FILE, UPLOAD_CONTENT_FILE, type RestoreParams } from '../schemas';
import { clearEnvironment, createSafetyBackup, errorText } from './shared';

// Loaded with require(): the package's ESM build does not resolve under Node's ESM loader.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const runContentfulImport: typeof runContentfulImportType = require('contentful-import');

/** Extract a zip into `dest`, refusing path traversal and zip bombs. Returns the assets root. */
async function extractAssets(zipPath: string, dest: string, maxBytes: number): Promise<string> {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    if (entries.length > 200_000) throw new HttpError(400, 'ZIP_TOO_LARGE', 'Asset archive has too many files');
    const total = entries.reduce((sum, e) => sum + (e.header.size || 0), 0);
    if (total > maxBytes) throw new HttpError(400, 'ZIP_TOO_LARGE', `Asset archive unpacks to more than ${Math.round(maxBytes / 1048576)} MB`);

    for (const entry of entries) {
        const target = resolveInside(dest, entry.entryName);
        if (entry.isDirectory) {
            await storage.ensureDir(target);
            continue;
        }
        await storage.ensureDir(path.dirname(target));
        await fsp.writeFile(target, entry.getData());
    }
    const nested = path.join(dest, 'assets');
    return (await fsp.stat(nested).catch(() => null))?.isDirectory() ? nested : dest;
}

export async function runRestore(ctx: JobContext<RestoreParams>) {
    const p = ctx.params;
    const token = await getActiveToken(ctx.userId);
    const workDir = await storage.ensureDir(storage.storagePath(...storage.keys.jobDir(ctx.jobId)));
    const uploadDir = p.uploadId ? storage.storagePath(...storage.keys.uploadDir(ctx.userId), p.uploadId) : null;
    const settings = await prisma.appSettings.findFirst();
    const maxBytes = (settings?.maxAssetSizeMB ?? 1024) * 1024 * 1024;

    try {
        // 1. Load content
        let content: BackupData;
        let assetsZip: string | null = null;
        if (p.backupId) {
            await ctx.log('Loading backup...');
            content = (await BackupService.getBackupContent(p.backupId, ctx.userId)) as BackupData;
            if (p.options.includeAssets) {
                const record = await BackupService.getBackupRecord(p.backupId, ctx.userId);
                if (record.hasZip && (await storage.exists(storage.keys.archive(ctx.userId, record.id)))) {
                    assetsZip = storage.storagePath(...storage.keys.archive(ctx.userId, record.id));
                }
            }
        } else {
            await ctx.log('Reading uploaded backup...');
            content = JSON.parse(await fsp.readFile(path.join(uploadDir!, UPLOAD_CONTENT_FILE), 'utf8')) as BackupData;
            const zip = path.join(uploadDir!, UPLOAD_ASSETS_FILE);
            if (await fsp.stat(zip).catch(() => null)) assetsZip = zip;
        }
        if (!content || typeof content !== 'object' || (!Array.isArray(content.entries) && !Array.isArray(content.contentTypes))) {
            throw new HttpError(400, 'INVALID_BACKUP', 'The backup file is not a Contentful export');
        }

        // 2. Filter and map locales to the target
        if (p.options.locales?.length || p.options.contentTypes?.length) {
            content = filterBackupContent(content, { locales: p.options.locales, contentTypes: p.options.contentTypes });
        }
        const targetLocales = (await ContentfulManagement.getLocales(p.spaceId, p.targetEnvironment, token)) as BackupLocale[];
        const targetCodes = new Set(targetLocales.map((l) => l.code));
        if (p.localeMapping && Object.keys(p.localeMapping).length > 0) {
            content = transformBackupLocales(content, p.localeMapping);
            content = cleanupBackupLocales(content, new Set([...targetCodes, ...Object.values(p.localeMapping)]));
        } else {
            const targetDefault = targetLocales.find((l) => l.default)?.code;
            const sourceDefault = content.locales?.find((l) => l.default)?.code;
            if (targetDefault && sourceDefault && targetDefault !== sourceDefault) {
                content = transformBackupLocales(content, { [sourceDefault]: targetDefault });
            }
            content = cleanupBackupLocales(content, targetCodes);
        }

        // 3. Assets
        let assetsDirectory: string | undefined;
        if (assetsZip && p.options.includeAssets !== false) {
            await ctx.log('Unpacking asset archive...');
            assetsDirectory = await extractAssets(assetsZip, path.join(workDir, 'assets'), maxBytes * 2);
        }

        // 4. Safety snapshot, optional clear, import
        await createSafetyBackup(ctx, token, p.spaceId, p.targetEnvironment, 'pre-restore');
        await ctx.throwIfCancelled();
        if (p.options.clearEnvironment === true) {
            const env = await (await ContentfulManagement.getClient(token).getSpace(p.spaceId)).getEnvironment(p.targetEnvironment);
            await clearEnvironment(ctx, env);
        }

        await ctx.log(`Importing into ${p.spaceId}/${p.targetEnvironment}: ${content.contentTypes?.length ?? 0} content types, ${content.entries?.length ?? 0} entries, ${content.assets?.length ?? 0} assets...`);
        try {
            await runContentfulImport({
                spaceId: p.spaceId,
                environmentId: p.targetEnvironment,
                managementToken: token,
                content,
                uploadAssets: Boolean(assetsDirectory),
                assetsDirectory,
                errorLogFile: path.join(workDir, 'import-errors.json'),
                useVerboseRenderer: true,
            });
        } catch (err) {
            const errors = (err as { errors?: Array<{ error?: { message?: string } }> }).errors ?? [];
            const sample = errors.slice(0, 5).map((e) => e.error?.message).filter(Boolean);
            for (const line of sample) await ctx.log(`   ⚠️  ${line}`, 'error');
            throw new Error(errors.length
                ? `Import completed with ${errors.length} error(s) (e.g. validation or content model conflicts)`
                : `Import failed: ${errorText(err)}`);
        }

        await ctx.log(`Restore to ${p.targetEnvironment} completed`, 'success');
        return { targetEnvironment: p.targetEnvironment };
    } finally {
        if (uploadDir) await fsp.rm(uploadDir, { recursive: true, force: true }).catch(() => undefined);
    }
}
