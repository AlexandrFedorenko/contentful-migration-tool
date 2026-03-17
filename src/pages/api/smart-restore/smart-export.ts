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
    buildAssetMap,
} from '@/utils/dependency-resolver';
import { filterEntryLocales, filterAssetLocales, remapLocaleDefinitions, remapContentTypeDefaults } from '@/utils/locale-filter';
import type { BackupEntry, BackupAsset } from '@/types/backup';

/**
 * POST /api/smart-restore/smart-export
 *
 * Builds a selective, correct JSON export from live CMA data.
 * Applies:
 *  - Content Type dependency resolution (auto-includes referenced CTs)
 *  - Entry dependency resolution (recursive links)
 *  - Locale filtering (strips non-selected locales — no entry duplication!)
 *  - Locale code remapping (e.g. "en" → "en-US")
 *
 * Completely independent from existing backup/restore flow.
 */
export const config = {
    api: {
        responseLimit: false,
    },
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
        spaceId,
        environmentId,
        selectedContentTypeIds,
        selectedLocales,
        localeMapping = {},
        includeAssets = true,
    }: {
        spaceId: string;
        environmentId: string;
        selectedContentTypeIds: string[];
        selectedLocales: string[];
        localeMapping?: Record<string, string>;
        includeAssets?: boolean;
    } = req.body;

    if (!spaceId || !environmentId || !selectedContentTypeIds?.length) {
        return res.status(400).json({ success: false, error: 'spaceId, environmentId, selectedContentTypeIds are required' });
    }

    try {
        const token = decrypt(user.contentfulToken);

        // 1. Fetch all content types to resolve dependencies
        const allCTs = await ContentfulManagement.getContentTypes(spaceId, environmentId, token);
        const localeItems = await ContentfulManagement.getLocales(spaceId, environmentId, token);

        // 2. Resolve CT dependencies (auto-include referenced CTs)
        const { resolved: resolvedCTIds } = resolveContentTypeDependencies(
            new Set(selectedContentTypeIds),
            allCTs
        );

        const selectedLocaleSet = new Set<string>(selectedLocales.length > 0 ? selectedLocales : []);

        // 3. Fetch entries for resolved CTs only (paginated via CMA)
        const client = ContentfulManagement.getClient(token);
        const space = await client.getSpace(spaceId);
        const env = await space.getEnvironment(environmentId);

        const allEntries: BackupEntry[] = [];
        for (const ctId of resolvedCTIds) {
            let skip = 0;
            const limit = 1000;
            let hasMore = true;
            while (hasMore) {
                const batch = await env.getEntries({ content_type: ctId, limit, skip });
                for (const e of batch.items) {
                    allEntries.push({
                        sys: {
                            type: 'Entry',
                            id: e.sys.id,
                            contentType: { sys: { type: 'Link', linkType: 'ContentType', id: e.sys.contentType.sys.id } },
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

        // 4. Resolve entry dependencies (pull in linked entries/assets recursively)
        const entryMap = buildEntryMap(allEntries);
        const seedEntries = allEntries; // already filtered by CT
        const { entryIds: resolvedEntryIds, assetIds: resolvedAssetIds } = resolveEntryDependencies(
            seedEntries,
            entryMap
        );

        // 5. Apply locale filtering — CORRECT approach: filter keys inside each entry
        const filteredEntries = Array.from(resolvedEntryIds)
            .map(id => entryMap.get(id)!)
            .filter(Boolean)
            .map(entry => filterEntryLocales(entry, selectedLocaleSet, localeMapping));

        // 6. Fetch and filter assets (if includeAssets)
        let filteredAssets: BackupAsset[] = [];
        let assetFileUrls: Array<{ id: string; url: string; fileName: string }> = [];

        if (includeAssets && resolvedAssetIds.size > 0) {
            const allAssets: BackupAsset[] = [];
            for (const assetId of resolvedAssetIds) {
                try {
                    const asset = await env.getAsset(assetId);
                    allAssets.push({
                        sys: {
                            type: 'Asset',
                            id: asset.sys.id,
                            version: asset.sys.version,
                            publishedVersion: asset.sys.publishedVersion,
                            createdAt: asset.sys.createdAt,
                            updatedAt: asset.sys.updatedAt,
                        },
                        fields: asset.fields as Record<string, unknown>,
                    });
                } catch { /* asset may have been deleted */ }
            }

            const assetMap = buildAssetMap(allAssets);
            filteredAssets = Array.from(resolvedAssetIds)
                .map(id => assetMap.get(id)!)
                .filter(Boolean)
                .map(asset => filterAssetLocales(asset, selectedLocaleSet, localeMapping));

            // Collect CDN URLs for ZIP download
            assetFileUrls = filteredAssets.flatMap(asset => {
                const fileField = (asset.fields as any)?.file;
                if (!fileField) return [];
                return Object.entries(fileField as Record<string, any>).flatMap(([, localeVal]: [string, any]) => {
                    const url = localeVal?.url ? `https:${localeVal.url}` : null;
                    const fileName = localeVal?.fileName ?? `${asset.sys.id}`;
                    return url ? [{ id: asset.sys.id, url, fileName }] : [];
                });
            });
        }

        // 7. Build filtered content types and locales for the export
        const exportCTs = allCTs.filter(ct => resolvedCTIds.has(ct.sys.id));
        const remappedCTs = remapContentTypeDefaults(
            exportCTs.map(ct => ({ ...ct, fields: ct.fields as any[] })),
            localeMapping
        );

        const sourceLocales = localeItems.map((l: any) => ({
            sys: { type: 'Locale', id: l.sys.id, version: l.sys.version },
            code: l.code,
            name: l.name,
            default: l.default ?? false,
            fallbackCode: l.fallbackCode ?? null,
        }));

        const filteredLocales = selectedLocaleSet.size > 0
            ? sourceLocales.filter((l: { code: string }) => selectedLocaleSet.has(l.code))
            : sourceLocales;
        const remappedLocales = remapLocaleDefinitions(filteredLocales, localeMapping);

        // 8. Build final export payload
        const exportData = {
            sys: { type: 'Array', id: `smart-export-${Date.now()}` },
            contentTypes: remappedCTs,
            entries: filteredEntries,
            assets: filteredAssets,
            locales: remappedLocales,
            editorInterfaces: [],
        };

        return res.status(200).json({
            success: true,
            data: {
                exportData,
                stats: {
                    contentTypes: remappedCTs.length,
                    entries: filteredEntries.length,
                    assets: filteredAssets.length,
                    locales: remappedLocales.length,
                },
                assetFileUrls,
            },
        });
    } catch (error) {
        console.error('[SMART EXPORT ERROR]', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Export failed',
        });
    }
}
