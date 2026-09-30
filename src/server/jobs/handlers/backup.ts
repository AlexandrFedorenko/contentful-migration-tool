import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import type runContentfulExportType from 'contentful-export';
import { prisma } from '@/lib/db';
import { getActiveToken } from '@/server/contentful/credentials';
import { HttpError } from '@/server/http-error';
import * as storage from '@/server/storage';
import { BackupService } from '@/utils/backup-service';
import { ContentfulManagement } from '@/utils/contentful-management';
import type { JobContext } from '../context';
import type { BackupParams } from '../schemas';
import { errorText } from './shared';

// Loaded with require(): the packages' ESM builds do not resolve under Node's ESM loader.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const runContentfulExport: typeof runContentfulExportType = require('contentful-export');

async function zipDirectory(sourceDir: string, zipPath: string, extraFile?: { path: string; name: string }): Promise<number> {
    await storage.ensureDir(path.dirname(zipPath));
    await new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(zipPath, { mode: 0o640 });
        const archive = archiver('zip', { zlib: { level: 6 } });
        output.on('close', () => resolve());
        archive.on('error', reject);
        archive.pipe(output);
        if (extraFile) archive.file(extraFile.path, { name: extraFile.name });
        archive.directory(sourceDir, 'assets');
        void archive.finalize();
    });
    return (await fsp.stat(zipPath)).size;
}

/**
 * Export an environment with the official contentful-export library (in-process,
 * token passed as an option, never on a command line) and store it in DATA_DIR.
 */
export async function runBackup(ctx: JobContext<BackupParams>) {
    const p = ctx.params;
    const token = await getActiveToken(ctx.userId);
    const workDir = await storage.ensureDir(storage.storagePath(...storage.keys.jobDir(ctx.jobId)));

    const settings = await prisma.appSettings.findFirst();
    if (p.includeAssets && settings && !settings.enableAssetBackups) {
        throw new HttpError(403, 'ASSET_BACKUPS_DISABLED', 'Asset backups are disabled by the administrator');
    }

    const space = await ContentfulManagement.getSpace(p.spaceId, token);
    const spaceName = (space?.name || p.spaceId).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60);

    await ctx.log(`Exporting ${p.spaceId}/${p.env}${p.includeAssets ? ' with assets' : ''}...`);
    let data: Record<string, unknown[]>;
    try {
        data = await runContentfulExport({
            spaceId: p.spaceId,
            environmentId: p.env,
            managementToken: token,
            includeDrafts: p.includeDrafts,
            includeArchived: p.includeArchived,
            downloadAssets: p.includeAssets,
            exportDir: workDir,
            errorLogFile: path.join(workDir, 'export-errors.json'),
            saveFile: false,
            skipRoles: true,
            skipWebhooks: true,
            useVerboseRenderer: true,
            managementApplication: 'contentful-migration-tool/1.0',
        }) as Record<string, unknown[]>;
    } catch (err) {
        const errors = (err as { errors?: Array<{ error?: { message?: string } }> }).errors;
        const first = errors?.[0]?.error?.message;
        throw new Error(`Export failed${first ? `: ${first}` : `: ${errorText(err)}`}`);
    }
    await ctx.throwIfCancelled();

    const stats = {
        entries: data.entries?.length ?? 0,
        assets: data.assets?.length ?? 0,
        contentTypes: data.contentTypes?.length ?? 0,
        locales: data.locales?.length ?? 0,
    };
    await ctx.log(`Exported ${stats.contentTypes} content types, ${stats.entries} entries, ${stats.assets} assets, ${stats.locales} locales`);

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `${spaceName}-${p.env}-${ts}.json`;

    await BackupService.checkBackupLimit(p.spaceId, ctx.userId, true, false);
    const saved = await BackupService.saveBackup({ userId: ctx.userId, spaceId: p.spaceId, environmentId: p.env, name, content: data, stats });

    let hasZip = false;
    if (p.includeAssets) {
        const assetRoots = (await fsp.readdir(workDir, { withFileTypes: true })).filter((d) => d.isDirectory());
        if (assetRoots.length > 0) {
            await BackupService.checkBackupLimit(p.spaceId, ctx.userId, p.overwrite, true);
            await ctx.log('Packing asset archive...');
            const jsonPath = path.join(workDir, name);
            await fsp.writeFile(jsonPath, JSON.stringify(data));
            const assetsDir = path.join(workDir, '__assets');
            await storage.ensureDir(assetsDir);
            for (const d of assetRoots) await fsp.rename(path.join(workDir, d.name), path.join(assetsDir, d.name));

            const zipPath = storage.storagePath(...storage.keys.archive(ctx.userId, saved.id));
            const size = await zipDirectory(assetsDir, zipPath, { path: jsonPath, name });
            const maxMB = settings?.maxAssetSizeMB ?? 1024;
            if (size > maxMB * 1024 * 1024) {
                await storage.remove(storage.keys.archive(ctx.userId, saved.id));
                await ctx.log(`⚠️  Asset archive is ${(size / 1048576).toFixed(1)} MB, above the ${maxMB} MB limit; kept the JSON backup only.`, 'error');
            } else {
                await prisma.backupRecord.update({ where: { id: saved.id }, data: { hasZip: true } });
                hasZip = true;
                await ctx.log(`Asset archive ready (${(size / 1048576).toFixed(1)} MB)`);
            }
        } else {
            await ctx.log('No asset files were downloaded.');
        }
    }

    await ctx.log('Backup completed', 'success');
    return { backupFile: name, backupId: saved.id, hasZip, stats };
}
