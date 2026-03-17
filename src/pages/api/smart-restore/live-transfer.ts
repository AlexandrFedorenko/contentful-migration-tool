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
import { sleep, RATE_LIMIT_DELAY_MS } from '@/utils/async';
import type { BackupEntry } from '@/types/backup';

/**
 * POST /api/smart-restore/live-transfer
 *
 * Transfers selected content between environments/spaces via CMA directly.
 * Supports:
 *  - env-to-env (same space)
 *  - cross-space (sourceSpaceId !== targetSpaceId, same account token)
 *
 * Key features:
 *  - Recursive CT dependency resolution (auto-includes referenced CTs)
 *  - Recursive entry dependency resolution
 *  - Correct locale filtering (strips keys, no entry duplication)
 *  - Locale code remapping (e.g. "en" → "en-US")
 *  - Optional environment clear before transfer
 *
 * Completely independent from existing restore.ts flow.
 */
export const config = {
    api: { responseLimit: false },
};

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

    const {
        sourceSpaceId,
        sourceEnvironmentId,
        targetSpaceId,
        targetEnvironmentId,
        selectedContentTypeIds,
        selectedLocales = [],
        localeMapping = {},
        options = {},
    }: {
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
    } = req.body;

    if (!sourceSpaceId || !sourceEnvironmentId || !targetSpaceId || !targetEnvironmentId || !selectedContentTypeIds?.length) {
        return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

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

        // Fetch all CTs from source
        const allCTs = await ContentfulManagement.getContentTypes(sourceSpaceId, sourceEnvironmentId, token);

        // Resolve CT dependencies
        const { resolved: resolvedCTIds } = resolveContentTypeDependencies(
            new Set(selectedContentTypeIds),
            allCTs
        );

        // Fetch entries for resolved CTs
        const allEntries: BackupEntry[] = [];
        for (const ctId of resolvedCTIds) {
            let skip = 0;
            const limit = 1000;
            let hasMore = true;
            while (hasMore) {
                const batch = await srcEnv.getEntries({ content_type: ctId, limit, skip });
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
                hasMore = batch.items.length === limit;
                skip += limit;
            }
        }

        // Resolve entry dependencies recursively
        const entryMap = buildEntryMap(allEntries);
        const { entryIds: resolvedEntryIds, assetIds: resolvedAssetIds } = resolveEntryDependencies(
            allEntries,
            entryMap
        );

        // Apply locale filtering
        const filteredEntries = Array.from(resolvedEntryIds)
            .map(id => entryMap.get(id)!)
            .filter(Boolean)
            .map(entry => filterEntryLocales(entry, selectedLocaleSet, localeMapping));

        // Optional: clear target environment
        if (options.clearEnvironment) {
            const deleteAll = async (type: 'Entry' | 'Asset' | 'ContentType') => {
                let hasItems = true;
                let stuckCount = 0;
                let skip = 0;
                while (hasItems && stuckCount < 5) {
                    let items: any;
                    if (type === 'Entry') items = await tgtEnv.getEntries({ limit: 100, skip });
                    else if (type === 'Asset') items = await tgtEnv.getAssets({ limit: 100, skip });
                    else items = await tgtEnv.getContentTypes({ limit: 100, skip });

                    if (!items?.items?.length) { hasItems = false; break; }
                    let deleted = 0;
                    for (const item of items.items) {
                        try { if (item.isPublished()) await item.unpublish(); } catch { }
                        try { await item.delete(); deleted++; } catch { }
                        await sleep(RATE_LIMIT_DELAY_MS);
                    }
                    if (deleted === 0) { skip += items.items.length; stuckCount++; }
                    else { skip = 0; stuckCount = 0; }
                }
            };
            await deleteAll('Entry');
            await deleteAll('Asset');
            await deleteAll('ContentType');
            await sleep(2000);
        }

        // Upsert Content Types into target
        const resolvedCTsData = allCTs.filter(ct => resolvedCTIds.has(ct.sys.id));

        for (const ct of resolvedCTsData) {
            try {
                let existingCT: any = null;
                try { existingCT = await tgtEnv.getContentType(ct.sys.id); } catch { }

                if (existingCT) {
                    // Update
                    existingCT.name = ct.name;
                    existingCT.description = ct.description ?? '';
                    existingCT.displayField = ct.displayField ?? '';
                    existingCT.fields = ct.fields as any[];
                    const updated = await existingCT.update();
                    try { await updated.publish(); } catch { }
                } else {
                    // Create
                    const created = await tgtEnv.createContentTypeWithId(ct.sys.id, {
                        name: ct.name,
                        description: ct.description ?? '',
                        displayField: ct.displayField ?? '',
                        fields: ct.fields as any[],
                    });
                    try { await created.publish(); } catch { }
                }
                await sleep(RATE_LIMIT_DELAY_MS);
            } catch {
                // Continue on individual CT failures
            }
        }

        // Upsert entries into target
        let successEntries = 0;
        let failedEntries = 0;

        for (const entry of filteredEntries) {
            try {
                if (mergeMode === 'skip-existing') {
                    try { await tgtEnv.getEntry(entry.sys.id); continue; } catch { }
                }

                let existingEntry: any = null;
                try { existingEntry = await tgtEnv.getEntry(entry.sys.id); } catch { }

                if (existingEntry) {
                    existingEntry.fields = entry.fields;
                    await existingEntry.update();
                } else {
                    await tgtEnv.createEntryWithId(
                        entry.sys.contentType.sys.id,
                        entry.sys.id,
                        { fields: entry.fields as any }
                    );
                }
                successEntries++;
                await sleep(RATE_LIMIT_DELAY_MS);
            } catch {
                failedEntries++;
            }
        }

        // Upsert assets (if requested)
        let successAssets = 0;
        if (options.includeAssets && resolvedAssetIds.size > 0) {
            for (const assetId of resolvedAssetIds) {
                try {
                    const srcAsset = await srcEnv.getAsset(assetId);
                    const filteredAsset = filterAssetLocales(
                        {
                            sys: { id: srcAsset.sys.id, version: srcAsset.sys.version },
                            fields: srcAsset.fields as Record<string, unknown>,
                        },
                        selectedLocaleSet,
                        localeMapping
                    );

                    let existingAsset: any = null;
                    try { existingAsset = await tgtEnv.getAsset(assetId); } catch { }

                    if (existingAsset) {
                        existingAsset.fields = filteredAsset.fields;
                        await existingAsset.update();
                    } else {
                        await tgtEnv.createAssetWithId(assetId, { fields: filteredAsset.fields as any });
                    }
                    successAssets++;
                    await sleep(RATE_LIMIT_DELAY_MS);
                } catch {
                    // Continue on individual asset failures
                }
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                isCrossSpace,
                stats: {
                    contentTypes: resolvedCTsData.length,
                    entries: { success: successEntries, failed: failedEntries },
                    assets: successAssets,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Transfer failed',
        });
    }
}
