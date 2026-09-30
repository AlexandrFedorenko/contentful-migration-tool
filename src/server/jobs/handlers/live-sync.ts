/* eslint-disable @typescript-eslint/no-explicit-any */
import { getActiveToken } from '@/server/contentful/credentials';
import { ContentfulManagement } from '@/utils/contentful-management';
import { buildEntryMap, resolveContentTypeDependencies, resolveEntryDependencies } from '@/utils/dependency-resolver';
import { filterAssetLocales, filterEntryLocales } from '@/utils/locale-filter';
import type { BackupEntry } from '@/types/backup';
import type { JobContext } from '../context';
import type { LiveSyncParams } from '../schemas';
import { clearEnvironment, createSafetyBackup, errorText } from './shared';


/**
 * Copy content types, (optionally) locales and assets, and entries with all their
 * dependencies from one environment to another through the CMA.
 *
 *  - `migrate` (Smart Migration): can narrow to selected entries, creates missing locales,
 *    replaces entry fields.
 *  - `transfer` (Smart Restore live transfer): merges field locales into existing entries.
 */
export function runLiveSync(mode: 'migrate' | 'transfer') {
    const noun = mode === 'migrate' ? 'Migration' : 'Transfer';

    return async (ctx: JobContext<LiveSyncParams>) => {
        const p = ctx.params;
        const token = await getActiveToken(ctx.userId);
        const isCrossSpace = p.sourceSpaceId !== p.targetSpaceId;
        const selectedLocaleSet = new Set(p.selectedLocales);
        const localeMapping = p.localeMapping;

        const client = ContentfulManagement.getClient(token);
        const [srcSpace, tgtSpace] = await Promise.all([client.getSpace(p.sourceSpaceId), client.getSpace(p.targetSpaceId)]);
        const [srcEnv, tgtEnv] = await Promise.all([
            srcSpace.getEnvironment(p.sourceEnvironmentId),
            tgtSpace.getEnvironment(p.targetEnvironmentId),
        ]);

        await createSafetyBackup(ctx, token, p.targetSpaceId, p.targetEnvironmentId, mode === 'migrate' ? 'pre-migrate' : 'pre-transfer');

        await ctx.log(`📦  Fetching content types from source...`);
        const allCTs = await ContentfulManagement.getContentTypes(p.sourceSpaceId, p.sourceEnvironmentId, token);
        await ctx.log(`    Found ${allCTs.length} content types`);
        const { resolved: resolvedCTIds } = resolveContentTypeDependencies(new Set(p.selectedContentTypeIds), allCTs);
        await ctx.log(`    Resolved ${resolvedCTIds.size} CTs (including dependencies)`);

        await ctx.log(`📄  Fetching entries for ${resolvedCTIds.size} content types...`);
        const validCTIds = new Set(allCTs.map((ct) => ct.sys.id));
        let allEntries: BackupEntry[] = [];
        for (const ctId of resolvedCTIds) {
            if (!validCTIds.has(ctId)) {
                await ctx.log(`   ⚠️  Skipping missing Content Type: ${ctId}`);
                continue;
            }
            for (let skip = 0; ; skip += 1000) {
                await ctx.throwIfCancelled();
                const batch = await srcEnv.getEntries({ content_type: ctId, limit: 1000, skip });
                for (const e of batch.items) {
                    allEntries.push({
                        sys: {
                            id: e.sys.id,
                            contentType: { sys: { id: e.sys.contentType.sys.id } },
                            version: e.sys.version,
                            publishedVersion: e.sys.publishedVersion,
                            createdAt: e.sys.createdAt,
                            updatedAt: e.sys.updatedAt,
                        },
                        fields: e.fields as Record<string, unknown>,
                    });
                }
                if (batch.items.length < 1000) break;
            }
        }
        if (p.selectedEntryIds.length > 0) {
            const selected = new Set(p.selectedEntryIds);
            const before = allEntries.length;
            allEntries = allEntries.filter((e) => selected.has(e.sys.id));
            await ctx.log(`    Filtered to ${allEntries.length} selected entries (from ${before} fetched)`);
        }
        await ctx.log(`    Total entries: ${allEntries.length}`);

        await ctx.log(`🔗  Resolving entry/asset dependencies...`);
        const entryMap = buildEntryMap(allEntries);
        const { entryIds, assetIds } = resolveEntryDependencies(allEntries, entryMap);
        await ctx.log(`    Resolved: ${entryIds.size} entries, ${assetIds.size} assets`);
        const entries = Array.from(entryIds)
            .map((id) => entryMap.get(id)!)
            .filter(Boolean)
            .map((e) => filterEntryLocales(e, selectedLocaleSet, localeMapping));

        if (p.options.clearEnvironment) await clearEnvironment(ctx, tgtEnv);

        // Content types
        const cts = allCTs.filter((ct) => resolvedCTIds.has(ct.sys.id));
        await ctx.log(`📋  Upserting ${cts.length} content types...`);
        for (const ct of cts) {
            await ctx.throwIfCancelled();
            try {
                let existing: any = null;
                try { existing = await tgtEnv.getContentType(ct.sys.id); } catch { /* new */ }
                const data = { name: ct.name, description: ct.description ?? '', displayField: ct.displayField ?? '', fields: ct.fields as any[] };
                const saved = existing
                    ? await Object.assign(existing, data).update()
                    : await tgtEnv.createContentTypeWithId(ct.sys.id, data);
                try { await saved.publish(); } catch (err) { await ctx.log(`   ⚠️  CT ${ct.sys.id} publish: ${errorText(err)}`); }
            } catch (err) {
                await ctx.log(`   ⚠️  CT ${ct.sys.id}: ${errorText(err)}`);
            }
        }
        await ctx.log(`    Content types done`);

        // Locales (migration only)
        if (mode === 'migrate' && p.selectedLocales.length > 0) {
            await ctx.log(`🌍  Migrating ${p.selectedLocales.length} locale(s)...`);
            const sourceLocales = await ContentfulManagement.getLocales(p.sourceSpaceId, p.sourceEnvironmentId, token);
            const targetLocales = (await tgtEnv.getLocales()).items;
            for (const code of p.selectedLocales) {
                const src = sourceLocales.find((l: any) => l.code === code);
                if (!src) continue;
                const targetCode = localeMapping[code] ?? code;
                const existing: any = targetLocales.find((l) => l.code === targetCode);
                try {
                    if (existing) {
                        existing.name = src.name;
                        existing.fallbackCode = src.fallbackCode ?? null;
                        await existing.update();
                        await ctx.log(`    ♻️  Locale updated: ${targetCode}`);
                    } else {
                        await tgtEnv.createLocale({ name: src.name, code: targetCode, fallbackCode: src.fallbackCode ?? null } as any);
                        await ctx.log(`    ➕  Locale created: ${targetCode}`);
                    }
                } catch (err) {
                    await ctx.log(`   ⚠️  Locale ${code}: ${errorText(err)}`);
                }
            }
        }

        // Assets
        let successAssets = 0;
        if (p.options.includeAssets && assetIds.size > 0) {
            await ctx.log(`🖼️   Upserting ${assetIds.size} assets...`);
            for (const assetId of assetIds) {
                await ctx.throwIfCancelled();
                try {
                    const srcAsset = await srcEnv.getAsset(assetId);
                    const filtered = filterAssetLocales(
                        { sys: { id: srcAsset.sys.id, version: srcAsset.sys.version }, fields: srcAsset.fields as Record<string, unknown> },
                        selectedLocaleSet,
                        localeMapping
                    );
                    let existing: any = null;
                    try { existing = await tgtEnv.getAsset(assetId); } catch { /* new */ }
                    let asset: any;
                    if (existing) {
                        if (mode === 'migrate') existing.fields = filtered.fields;
                        else for (const [f, vals] of Object.entries(filtered.fields as Record<string, any>)) existing.fields[f] = { ...(existing.fields[f] || {}), ...vals };
                        asset = await existing.update();
                    } else {
                        asset = await tgtEnv.createAssetWithId(assetId, { fields: filtered.fields as any });
                    }
                    if (srcAsset.sys.publishedVersion) {
                        try { asset = await asset.processForAllLocales(); } catch { /* already processed */ }
                        try { await asset.publish(); } catch (err) { await ctx.log(`   ⚠️  Asset ${assetId} publish failed: ${errorText(err)}`); }
                    }
                    successAssets++;
                } catch (err) {
                    await ctx.log(`   ⚠️  Asset ${assetId}: ${errorText(err)}`);
                }
            }
            await ctx.log(`    Assets: ${successAssets} done`);
        }

        // Entries (draft first, then publish in a second pass so links resolve)
        await ctx.log(`📝  Upserting ${entries.length} entries...`);
        let ok = 0;
        let failed = 0;
        const toPublish: BackupEntry[] = [];
        for (const entry of entries) {
            await ctx.throwIfCancelled();
            try {
                let existing: any = null;
                try { existing = await tgtEnv.getEntry(entry.sys.id); } catch { /* new */ }
                if (existing && p.options.mergeMode === 'skip-existing') { ok++; continue; }
                if (existing) {
                    if (mode === 'migrate') existing.fields = entry.fields;
                    else for (const [f, vals] of Object.entries(entry.fields as Record<string, any>)) existing.fields[f] = { ...(existing.fields[f] || {}), ...vals };
                    await existing.update();
                } else {
                    await tgtEnv.createEntryWithId(entry.sys.contentType.sys.id, entry.sys.id, { fields: entry.fields as any });
                }
                if (entry.sys.publishedVersion) toPublish.push(entry);
                ok++;
                if (ok % 25 === 0) await ctx.log(`    ${ok}/${entries.length} entries processed...`);
            } catch (err) {
                failed++;
                await ctx.log(`   ⚠️  Entry ${entry.sys.id}: ${errorText(err)}`);
            }
        }

        if (toPublish.length > 0) {
            await ctx.log(`🚀  Publishing ${toPublish.length} entries...`);
            for (const entry of toPublish) {
                await ctx.throwIfCancelled();
                try {
                    const target = await tgtEnv.getEntry(entry.sys.id);
                    const published = await target.publish();
                    // Source had unpublished changes on top of the published version: reproduce the "Changed" state.
                    const srcVersion = entry.sys.version ?? 0;
                    if (entry.sys.publishedVersion && srcVersion > entry.sys.publishedVersion + 1) await published.update();
                } catch (err) {
                    await ctx.log(`   ⚠️  Entry ${entry.sys.id} publish failed: ${errorText(err)}`);
                }
            }
        }
        await ctx.log(`    Entries: ${ok} ok, ${failed} failed`);
        await ctx.log(`✅  ${noun} complete!`);

        const result = {
            isCrossSpace,
            stats: { contentTypes: cts.length, entries: { success: ok, failed }, assets: successAssets },
        };
        await ctx.emit({ type: 'done', payload: result });
        return result;
    };
}
