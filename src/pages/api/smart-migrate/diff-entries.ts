import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { ContentfulManagement } from '@/utils/contentful-management';
import type { EntryDiffItem } from '@/types/smart-migrate';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchEntriesBatch(env: any, ctId: string, skip: number, limit: number): Promise<any[]> {
    try {
        const batch = await env.getEntries({ content_type: ctId, limit, skip });
        return batch.items;
    } catch (e) {
        console.error('Failed to fetch entries', e);
        return [];
    }
}

function resolveTitle(entry: any, displayField: string | null): string {
    if (!displayField || !entry.fields?.[displayField]) return entry.sys.id;
    const fieldVal = entry.fields[displayField];
    if (typeof fieldVal === 'object' && fieldVal !== null) {
        const firstVal = Object.values(fieldVal)[0];
        return typeof firstVal === 'string' ? firstVal : String(firstVal ?? entry.sys.id);
    }
    return typeof fieldVal === 'string' ? fieldVal : entry.sys.id;
}

function stableStringify(obj: unknown): string {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
    const sorted = Object.keys(obj as Record<string, unknown>).sort();
    return '{' + sorted.map(k => `${JSON.stringify(k)}:${stableStringify((obj as Record<string, unknown>)[k])}`).join(',') + '}';
}

function deepEqual(a: unknown, b: unknown): boolean {
    return stableStringify(a) === stableStringify(b);
}

function findChangedFieldKeys(srcFields: Record<string, unknown>, tgtFields: Record<string, unknown>): string[] {
    const allKeys = new Set([...Object.keys(srcFields), ...Object.keys(tgtFields)]);
    const changed: string[] = [];
    for (const key of allKeys) {
        if (!deepEqual(srcFields[key], tgtFields[key])) changed.push(key);
    }
    return changed;
}

function extractLinkIds(fields: Record<string, unknown>): { assetIds: Set<string>; entryIds: Set<string> } {
    const assetIds = new Set<string>();
    const entryIds = new Set<string>();
    const scan = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.sys?.type === 'Link') {
            if (obj.sys.linkType === 'Asset' && obj.sys.id) assetIds.add(obj.sys.id);
            if (obj.sys.linkType === 'Entry' && obj.sys.id) entryIds.add(obj.sys.id);
        } else if (Array.isArray(obj)) {
            obj.forEach(scan);
        } else {
            Object.values(obj).forEach(scan);
        }
    };
    scan(fields);
    return { assetIds, entryIds };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.contentfulToken) {
        return res.status(400).json({ success: false, error: 'Contentful token not configured' });
    }

    const { sourceSpaceId, sourceEnvId, targetSpaceId, targetEnvId, contentTypeId } = req.query as Record<string, string>;
    if (!sourceSpaceId || !sourceEnvId || !targetSpaceId || !targetEnvId || !contentTypeId) {
        return res.status(400).json({
            success: false,
            error: 'sourceSpaceId, sourceEnvId, targetSpaceId, targetEnvId, contentTypeId are required',
        });
    }

    const limit = Math.max(1, Math.min(1000, parseInt((req.query.limit as string) ?? '100', 10)));
    const skip = Math.max(0, parseInt((req.query.skip as string) ?? '0', 10));

    try {
        const token = decrypt(user.contentfulToken);
        const client = ContentfulManagement.getClient(token);

        const isCrossSpace = sourceSpaceId !== targetSpaceId;
        const [srcSpace, tgtSpace] = await Promise.all([
            client.getSpace(sourceSpaceId),
            isCrossSpace ? client.getSpace(targetSpaceId) : client.getSpace(sourceSpaceId),
        ]);
        const [srcEnv, tgtEnv] = await Promise.all([
            srcSpace.getEnvironment(sourceEnvId),
            tgtSpace.getEnvironment(targetEnvId),
        ]);

        // Fetch Content Type to get the displayField
        const srcCT = await srcEnv.getContentType(contentTypeId);
        const displayField = srcCT.displayField ?? null;

        // Fetch entries
        const [srcEntries, _tgtEntries] = await Promise.all([
            fetchEntriesBatch(srcEnv, contentTypeId, skip, limit),
            fetchEntriesBatch(tgtEnv, contentTypeId, skip, limit), // Ideally we only fetch matching target entries, but this works for pagination baseline
        ]);

        // To accurately diff, if we fetched a page of source entries, we need to fetch exactly those entries from target
        // Let's refetch target entries by ID to be safe and accurate for this batch
        const srcEntryIds = srcEntries.map(e => e.sys.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let exactTgtEntries: any[] = [];

        if (srcEntryIds.length > 0) {
            try {
                const tgtBatch = await tgtEnv.getEntries({ 'sys.id[in]': srcEntryIds.join(','), limit: srcEntryIds.length });
                exactTgtEntries = tgtBatch.items;
            } catch {
                // Target might not have these entries
                exactTgtEntries = [];
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tgtEntryMap = new Map(exactTgtEntries.map((e: any) => [e.sys.id, e]));
        const entryDiffs: EntryDiffItem[] = [];
        const globalAssetIds = new Set<string>();
        const globalEntryIds = new Set<string>();

        for (const srcEntry of srcEntries) {
            const tgtEntry = tgtEntryMap.get(srcEntry.sys.id);
            const title = resolveTitle(srcEntry, displayField);

            if (!tgtEntry) {
                entryDiffs.push({
                    id: srcEntry.sys.id, diffStatus: 'NEW', title, fields: srcEntry.fields,
                    sys: { version: srcEntry.sys.version, publishedVersion: srcEntry.sys.publishedVersion, updatedAt: srcEntry.sys.updatedAt, contentTypeId: srcCT.sys.id },
                });
                const { assetIds, entryIds } = extractLinkIds(srcEntry.fields);
                assetIds.forEach(id => globalAssetIds.add(id));
                entryIds.forEach(id => globalEntryIds.add(id));
            } else {
                const changedKeys = findChangedFieldKeys(srcEntry.fields as Record<string, unknown>, tgtEntry.fields as Record<string, unknown>);
                if (changedKeys.length > 0) {
                    entryDiffs.push({
                        id: srcEntry.sys.id, diffStatus: 'MODIFIED', title, fields: srcEntry.fields,
                        targetFields: tgtEntry.fields, changedFieldKeys: changedKeys,
                        sys: { version: srcEntry.sys.version, publishedVersion: srcEntry.sys.publishedVersion, updatedAt: srcEntry.sys.updatedAt, contentTypeId: srcCT.sys.id },
                    });
                    const { assetIds, entryIds } = extractLinkIds(srcEntry.fields);
                    assetIds.forEach(id => globalAssetIds.add(id));
                    entryIds.forEach(id => globalEntryIds.add(id));
                } else {
                    entryDiffs.push({
                        id: srcEntry.sys.id, diffStatus: 'EQUAL', title, fields: srcEntry.fields,
                        sys: { version: srcEntry.sys.version, publishedVersion: srcEntry.sys.publishedVersion, updatedAt: srcEntry.sys.updatedAt, contentTypeId: srcCT.sys.id },
                    });
                }
            }
        }

        // We also need to detect DELETED entries (exist in target, but not in source)
        // This is tricky with pagination. For now, we only detect NEW/MODIFIED/EQUAL in the source batch.
        // A full "smart migrate" might need a specialized deleted-check query.

        // Resolve referenced assets & entries for preview (limit 30 each to avoid overloading)
        const resolvedAssets: Record<string, { url: string; title: string; isImage: boolean }> = {};
        if (globalAssetIds.size > 0) {
            try {
                const ids = Array.from(globalAssetIds).slice(0, 30);
                const assetsResponse = await srcEnv.getAssets({ 'sys.id[in]': ids.join(',') });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                assetsResponse.items.forEach((asset: any) => {
                    const id = asset.sys.id;
                    let imageUrl = '', contentTypeStr = '';
                    const fileField = asset.fields?.file;
                    if (fileField && typeof fileField === 'object') {
                        if ('url' in fileField && typeof fileField.url === 'string') {
                            imageUrl = fileField.url; contentTypeStr = fileField.contentType || '';
                        } else {
                            for (const localeFile of Object.values(fileField)) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                if (typeof localeFile === 'object' && localeFile !== null && 'url' in localeFile && typeof (localeFile as any).url === 'string') {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    imageUrl = (localeFile as any).url; contentTypeStr = (localeFile as any).contentType || '';
                                    break;
                                }
                            }
                        }
                    }
                    let title = 'Asset';
                    if (asset.fields?.title) {
                        const v = Object.values(asset.fields.title);
                        if (v.length > 0 && typeof v[0] === 'string') title = v[0] as string;
                    }
                    if (imageUrl) {
                        const finalUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : (imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`);
                        const isImage = contentTypeStr.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(finalUrl);
                        resolvedAssets[id] = { url: finalUrl, title, isImage };
                    }
                });
            } catch { /* ignore */ }
        }

        const resolvedEntries: Record<string, { title: string; contentType?: string }> = {};
        if (globalEntryIds.size > 0) {
            try {
                const ids = Array.from(globalEntryIds).slice(0, 30);
                const entriesResponse = await srcEnv.getEntries({ 'sys.id[in]': ids.join(','), limit: 30 });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                entriesResponse.items.forEach((entry: any) => {
                    const id = entry.sys.id;
                    const cType = entry.sys.contentType?.sys?.id;
                    let title = id;
                    if (entry.fields) {
                        const titleFieldKey = Object.keys(entry.fields).find(k =>
                            k.toLowerCase().includes('title') || k.toLowerCase().includes('name') ||
                            k.toLowerCase().includes('slug') || k.toLowerCase().includes('label')
                        );
                        if (titleFieldKey) {
                            const val = Object.values(entry.fields[titleFieldKey])[0];
                            if (typeof val === 'string') title = val;
                        }
                    }
                    resolvedEntries[id] = { title, contentType: cType };
                });
            } catch { /* ignore */ }
        }

        return res.status(200).json({
            success: true,
            data: {
                entries: entryDiffs,
                resolvedAssets,
                resolvedEntries
            }
        });
    } catch (error) {
        console.error('[DIFF ENTRIES ERROR]', error);
        return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to compute entry diff' });
    }
}
