/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { ContentfulManagement } from '@/utils/contentful-management';
import {
    resolveContentTypeDependencies,
    resolveEntryDependencies,
    buildEntryMap,
} from '@/utils/dependency-resolver';
import { filterEntryLocales, filterAssetLocales } from '@/utils/locale-filter';
import { BackupService } from '@/utils/backup-service';
import type { BackupEntry } from '@/types/backup';

/**
 * POST /api/smart-restore/live-transfer-stream
 *
 * Server-Sent Events (SSE) streaming version of live-transfer.
 * Emits progress log lines so the UI can display real-time logs.
 *
 * Extra safety: automatically creates a full backup of the TARGET environment
 * before any mutation — saved to the backups table so it can be restored if needed.
 *
 * Client uses: const es = new EventSource('/api/smart-restore/live-transfer-stream', ...)
 * Events format: { type: 'log' | 'done' | 'error', payload: string | stats }
 */
export const config = {
    api: { responseLimit: false },
};

const DELAY_MS = 150;
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function sendEvent(res: NextApiResponse, type: string, payload: unknown) {
    res.write(`data: ${JSON.stringify({ type, payload })}\n\n`);
    // Force Next.js to flush the stream so the UI updates immediately
    if (typeof (res as any).flush === 'function') {
        (res as any).flush();
    }
}

function log(res: NextApiResponse, message: string) {
    console.log('[LIVE TRANSFER]', message);
    sendEvent(res, 'log', message);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.contentfulToken) {
        return res.status(400).json({ success: false, error: 'Contentful token not configured' });
    }

    // Set up SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });

    const {
        sourceSpaceId,
        sourceEnvironmentId,
        targetSpaceId,
        targetEnvironmentId,
        selectedContentTypeIds,
        selectedLocales = [],
        localeMapping = {},
        options = {},
    } = req.body as {
        sourceSpaceId: string;
        sourceEnvironmentId: string;
        targetSpaceId: string;
        targetEnvironmentId: string;
        selectedContentTypeIds: string[];
        selectedLocales?: string[];
        localeMapping?: Record<string, string>;
        options?: {
            clearEnvironment?: boolean;
            includeAssets?: boolean;
            mergeMode?: 'upsert' | 'skip-existing';
        };
    };

    const token = decrypt(user.contentfulToken);
    const isCrossSpace = sourceSpaceId !== targetSpaceId;
    const selectedLocaleSet = new Set<string>(selectedLocales);
    const mergeMode = options.mergeMode ?? 'upsert';

    try {
        const client = ContentfulManagement.getClient(token);
        const [srcSpace, tgtSpace] = await Promise.all([
            client.getSpace(sourceSpaceId),
            isCrossSpace ? client.getSpace(targetSpaceId) : client.getSpace(sourceSpaceId),
        ]);
        const [srcEnv, tgtEnv] = await Promise.all([
            srcSpace.getEnvironment(sourceEnvironmentId),
            tgtSpace.getEnvironment(targetEnvironmentId),
        ]);


        log(res, `🛡️  Creating safety backup of target: ${targetSpaceId}/${targetEnvironmentId}...`);
        try {
            const [targetCTs, targetLocales, targetEntries, targetAssets] = await Promise.all([
                ContentfulManagement.getContentTypes(targetSpaceId, targetEnvironmentId, token),
                ContentfulManagement.getLocales(targetSpaceId, targetEnvironmentId, token),
                ContentfulManagement.getEntries(targetSpaceId, targetEnvironmentId, token),
                ContentfulManagement.getAssets(targetSpaceId, targetEnvironmentId, token),
            ]);

            const backupData = {
                contentTypes: targetCTs,
                locales: targetLocales,
                entries: targetEntries,
                assets: targetAssets,
                exportedAt: new Date().toISOString(),
                source: `${targetSpaceId}/${targetEnvironmentId}`,
            };

            const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const backupName = `pre-transfer-${targetEnvironmentId}-${ts}.json`;

            await BackupService.checkBackupLimit(targetSpaceId, userId, true, false);
            await BackupService.saveBackupToDb(userId, targetSpaceId, backupName, backupData, false);
            log(res, `✅  Safety backup saved: "${backupName}"`);
        } catch (backupErr) {
            log(res, `⚠️  Safety backup failed (transfer continues): ${backupErr instanceof Error ? backupErr.message : String(backupErr)}`);
        }


        log(res, `📦  Fetching content types from source...`);
        const allCTs = await ContentfulManagement.getContentTypes(sourceSpaceId, sourceEnvironmentId, token);
        log(res, `    Found ${allCTs.length} content types`);

        const { resolved: resolvedCTIds } = resolveContentTypeDependencies(new Set(selectedContentTypeIds), allCTs);
        log(res, `    Resolved ${resolvedCTIds.size} CTs (including dependencies)`);


        log(res, `📄  Fetching entries for ${resolvedCTIds.size} content types...`);
        const validCTIds = new Set(allCTs.map(ct => ct.sys.id));
        const allEntries: BackupEntry[] = [];
        for (const ctId of resolvedCTIds) {
            if (!validCTIds.has(ctId)) {
                log(res, `   ⚠️  Skipping missing Content Type: ${ctId}`);
                continue;
            }
            let skip = 0; let hasMore = true;
            while (hasMore) {
                try {
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
                    hasMore = batch.items.length === 1000; skip += 1000;
                } catch (err) {
                    log(res, `   ⚠️  Failed to fetch entries for CT ${ctId}: ${err instanceof Error ? err.message : String(err)}`);
                    hasMore = false;
                }
            }
        }
        log(res, `    Total entries fetched: ${allEntries.length}`);


        log(res, `🔗  Resolving entry/asset dependencies...`);
        const entryMap = buildEntryMap(allEntries);
        const { entryIds: resolvedEntryIds, assetIds: resolvedAssetIds } = resolveEntryDependencies(allEntries, entryMap);
        log(res, `    Resolved: ${resolvedEntryIds.size} entries, ${resolvedAssetIds.size} assets`);

        // Filter + remap locales
        const filteredEntries = Array.from(resolvedEntryIds)
            .map(id => entryMap.get(id)!).filter(Boolean)
            .map(e => filterEntryLocales(e, selectedLocaleSet, localeMapping));


        // ──────────────────────────────────────────────────────────────────────────
        if (options.clearEnvironment) {
            log(res, `🗑️   Clearing target environment...`);
            const deleteAll = async (type: 'Entry' | 'Asset' | 'ContentType') => {
                let hasItems = true; let stuck = 0; let skip = 0;
                while (hasItems && stuck < 5) {
                    let items: any;
                    if (type === 'Entry') items = await tgtEnv.getEntries({ limit: 100, skip });
                    else if (type === 'Asset') items = await tgtEnv.getAssets({ limit: 100, skip });
                    else items = await tgtEnv.getContentTypes({ limit: 100, skip });
                    if (!items?.items?.length) { hasItems = false; break; }
                    let deleted = 0;
                    for (const item of items.items) {
                        try { if (item.isPublished()) await item.unpublish(); } catch { }
                        try { await item.delete(); deleted++; } catch { }
                        await sleep(DELAY_MS);
                    }
                    if (deleted === 0) { skip += items.items.length; stuck++; } else { skip = 0; stuck = 0; }
                }
            };
            await deleteAll('Entry');
            log(res, `    Entries cleared`);
            await deleteAll('Asset');
            log(res, `    Assets cleared`);
            await deleteAll('ContentType');
            log(res, `    Content types cleared`);
            await sleep(2000);
        }


        const resolvedCTsData = allCTs.filter(ct => resolvedCTIds.has(ct.sys.id));
        log(res, `📋  Upserting ${resolvedCTsData.length} content types...`);
        for (const ct of resolvedCTsData) {
            try {
                let existing: any = null;
                try { existing = await tgtEnv.getContentType(ct.sys.id); } catch { }
                if (existing) {
                    existing.name = ct.name; existing.description = ct.description ?? ''; existing.displayField = ct.displayField ?? ''; existing.fields = ct.fields as any[];
                    const updated = await existing.update();
                    try { await updated.publish(); } catch { }
                } else {
                    const created = await tgtEnv.createContentTypeWithId(ct.sys.id, { name: ct.name, description: ct.description ?? '', displayField: ct.displayField ?? '', fields: ct.fields as any[] });
                    try { await created.publish(); } catch { }
                }
                await sleep(DELAY_MS);
            } catch (err) { log(res, `   ⚠️  CT ${ct.sys.id}: ${err instanceof Error ? err.message : err}`); }
        }
        log(res, `    Content types done`);


        let successAssets = 0;
        if (options.includeAssets && resolvedAssetIds.size > 0) {
            log(res, `🖼️   Upserting ${resolvedAssetIds.size} assets...`);
            for (const assetId of resolvedAssetIds) {
                try {
                    const srcAsset = await srcEnv.getAsset(assetId);
                    const filtered = filterAssetLocales({ sys: { id: srcAsset.sys.id, version: srcAsset.sys.version }, fields: srcAsset.fields as Record<string, unknown> }, selectedLocaleSet, localeMapping);
                    let existing: any = null;
                    try { existing = await tgtEnv.getAsset(assetId); } catch { }

                    let assetObj: any = null;
                    if (existing) {
                        for (const [fieldName, localizedVals] of Object.entries(filtered.fields as Record<string, any>)) {
                            if (!existing.fields[fieldName]) existing.fields[fieldName] = {};
                            Object.assign(existing.fields[fieldName], localizedVals);
                        }
                        assetObj = await existing.update();
                    } else {
                        assetObj = await tgtEnv.createAssetWithId(assetId, { fields: filtered.fields as any });
                    }

                    if (srcAsset.sys.publishedVersion) {
                        try { assetObj = await assetObj.processForAllLocales(); } catch { }
                        try { await assetObj.publish(); } catch (err) {
                            log(res, `   ⚠️  Asset ${assetId} publish failed: ${err instanceof Error ? err.message : err}`);
                        }
                    }
                    successAssets++;
                    await sleep(DELAY_MS);
                } catch (err) { log(res, `   ⚠️  Asset ${assetId}: ${err instanceof Error ? err.message : err}`); }
            }
            log(res, `    Assets: ${successAssets} done`);
        }


        log(res, `📝  Upserting ${filteredEntries.length} entries...`);
        let successEntries = 0; let failedEntries = 0;
        const entriesToPublish: string[] = [];

        for (let i = 0; i < filteredEntries.length; i++) {
            const entry = filteredEntries[i];
            try {
                if (mergeMode === 'skip-existing') {
                    try { await tgtEnv.getEntry(entry.sys.id); successEntries++; continue; } catch { }
                }
                let existing: any = null;
                try { existing = await tgtEnv.getEntry(entry.sys.id); } catch { }

                if (existing) {
                    for (const [fieldName, localizedVals] of Object.entries(entry.fields as Record<string, any>)) {
                        if (!existing.fields[fieldName]) existing.fields[fieldName] = {};
                        Object.assign(existing.fields[fieldName], localizedVals);
                    }
                    await existing.update();
                } else {
                    await tgtEnv.createEntryWithId(entry.sys.contentType.sys.id, entry.sys.id, { fields: entry.fields as any });
                }

                if (entry.sys.publishedVersion) {
                    entriesToPublish.push(entry.sys.id);
                }

                successEntries++;
                if (successEntries % 10 === 0) {
                    log(res, `    ${successEntries}/${filteredEntries.length} entries transferred...`);
                }
                await sleep(DELAY_MS);
            } catch (err) {
                failedEntries++;
                log(res, `   ⚠️  Entry ${entry.sys.id}: ${err instanceof Error ? err.message : err}`);
            }
        }


        if (entriesToPublish.length > 0) {
            log(res, `🚀  Publishing ${entriesToPublish.length} entries...`);
            for (const entryId of entriesToPublish) {
                try {
                    const srcEntry = filteredEntries.find(e => e.sys.id === entryId);
                    if (!srcEntry) continue;

                    const srcVersion = srcEntry.sys.version ?? 0;
                    const isChanged = srcEntry.sys.publishedVersion && srcVersion > srcEntry.sys.publishedVersion + 1;
                    const tgtEntry = await tgtEnv.getEntry(entryId);

                    if (isChanged) {
                        await tgtEntry.publish();
                        const publishedTgt = await tgtEnv.getEntry(entryId);
                        await publishedTgt.update(); // minor update to bump version into Changed state
                    } else {
                        await tgtEntry.publish();
                    }

                    await sleep(DELAY_MS);
                } catch (err) {
                    log(res, `   ⚠️  Entry ${entryId} publish failed: ${err instanceof Error ? err.message : err}`);
                }
            }
        }
        log(res, `    Entries: ${successEntries} ok, ${failedEntries} failed`);

        log(res, `✅  Transfer complete!`);
        sendEvent(res, 'done', {
            isCrossSpace,
            stats: {
                contentTypes: resolvedCTsData.length,
                entries: { success: successEntries, failed: failedEntries },
                assets: successAssets,
            },
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        log(res, `❌  Fatal error: ${msg}`);
        sendEvent(res, 'error', msg);
    } finally {
        res.end();
    }
}
