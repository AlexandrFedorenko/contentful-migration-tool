/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Environment } from 'contentful-management';
import { ContentfulManagement } from '@/utils/contentful-management';
import { BackupService } from '@/utils/backup-service';
import type { JobContext } from '../context';

export const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Snapshot the target environment before any mutation and store it as a backup,
 * so every destructive operation can be rolled back with a regular restore.
 * Aborts the job when the snapshot fails: we never modify an environment we could not back up.
 */
export async function createSafetyBackup(
    ctx: JobContext,
    token: string,
    spaceId: string,
    environmentId: string,
    prefix: string
): Promise<string> {
    await ctx.log(`🛡️  Creating safety backup of target: ${spaceId}/${environmentId}...`);
    const [contentTypes, locales, entries, assets] = await Promise.all([
        ContentfulManagement.getContentTypes(spaceId, environmentId, token),
        ContentfulManagement.getLocales(spaceId, environmentId, token),
        ContentfulManagement.getEntries(spaceId, environmentId, token),
        ContentfulManagement.getAssets(spaceId, environmentId, token),
    ]);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const name = `${prefix}-${environmentId}-${ts}.json`;
    await BackupService.checkBackupLimit(spaceId, ctx.userId, true, false);
    const saved = await BackupService.saveBackup({
        userId: ctx.userId,
        spaceId,
        environmentId,
        name,
        content: { contentTypes, locales, entries, assets, exportedAt: new Date().toISOString(), source: `${spaceId}/${environmentId}` },
        stats: { contentTypes: contentTypes.length, entries: entries.length, assets: assets.length, locales: locales.length },
    });
    await ctx.log(`✅  Safety backup saved: "${name}"`);
    return saved.id;
}

/** Delete all entries, assets and content types of an environment (unpublishing first). */
export async function clearEnvironment(ctx: JobContext, env: Environment): Promise<void> {
    await ctx.log(`🗑️   Clearing target environment...`);
    const kinds: Array<['Entry' | 'Asset' | 'ContentType', string]> = [
        ['Entry', 'Entries'],
        ['Asset', 'Assets'],
        ['ContentType', 'Content types'],
    ];
    for (const [type, label] of kinds) {
        let skip = 0;
        let stuck = 0;
        let deletedTotal = 0;
        while (stuck < 5) {
            await ctx.throwIfCancelled();
            const page: any =
                type === 'Entry' ? await env.getEntries({ limit: 100, skip })
                    : type === 'Asset' ? await env.getAssets({ limit: 100, skip })
                        : await env.getContentTypes({ limit: 100, skip });
            if (!page?.items?.length) break;
            let deleted = 0;
            for (const item of page.items) {
                try { if (item.isPublished()) await item.unpublish(); } catch { /* not published */ }
                try { await item.delete(); deleted++; } catch { /* referenced or locked */ }
            }
            deletedTotal += deleted;
            if (deleted === 0) { skip += page.items.length; stuck++; } else { skip = 0; stuck = 0; }
        }
        await ctx.log(`    ${label} cleared (${deletedTotal})`);
    }
}
