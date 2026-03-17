import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { ContentfulManagement } from '@/utils/contentful-management';
import { resolveContentTypeDependencies } from '@/utils/dependency-resolver';

/**
 * GET /api/smart-restore/cma-preview
 *
 * Fetches live data from a Contentful environment via CMA:
 * content types, locales, and a title-resolved entry sample per CT.
 *
 * This is completely separate from the existing backup-based restore flow.
 */
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

    const { spaceId, environmentId } = req.query as Record<string, string>;
    if (!spaceId || !environmentId) {
        return res.status(400).json({ success: false, error: 'spaceId and environmentId are required' });
    }

    try {
        const token = decrypt(user.contentfulToken);

        // Fetch CT, locales in parallel
        const [contentTypes, localeItems] = await Promise.all([
            ContentfulManagement.getContentTypes(spaceId, environmentId, token),
            ContentfulManagement.getLocales(spaceId, environmentId, token),
        ]);

        const locales = localeItems.map((l: { code: string; name: string; default?: boolean; fallbackCode?: string | null }) => ({
            code: l.code,
            name: l.name,
            default: l.default ?? false,
            fallbackCode: l.fallbackCode ?? null,
        }));

        // Build CT summary with entry counts (via CMA count query if possible, else 0)
        // We do a lightweight fetch: just limit=1 per CT to verify existence, skip heavy fetches
        // Entry counts are fetched in a single paginated call to avoid rate limits
        const client = ContentfulManagement.getClient(token);
        const space = await client.getSpace(spaceId);
        const env = await space.getEnvironment(environmentId);

        // Get total entries count per content type
        const ctSummaries = await Promise.all(
            contentTypes.map(async (ct) => {
                try {
                    // Use Contentful delivery-style query format on CMA to resolve assets if possible
                    // Or we just extract sys.version and sys.publishedVersion
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const sample = await env.getEntries({
                        content_type: ct.sys.id,
                        limit: 3, // Reduce limit slightly since we're fetching more data
                        include: 2, // Ask CMA to resolve links if supported by this endpoint SDK
                    });

                    // Keep existing sampleTitles for backward compatibility
                    const sampleTitles = sample.items.map((e) => {
                        if (ct.displayField) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const fields = e.fields as Record<string, any>;
                            const fieldVal = fields?.[ct.displayField];
                            if (fieldVal && typeof fieldVal === 'object') {
                                // Return first locale value as display
                                const firstVal = Object.values(fieldVal)[0];
                                return typeof firstVal === 'string' ? firstVal : String(firstVal ?? '');
                            }
                        }
                        return e.sys.id;
                    });

                    // Build full entry sample data
                    const sampleEntries = sample.items.map((e) => ({
                        id: e.sys.id,
                        fields: e.fields,
                        sys: {
                            version: e.sys.version,
                            publishedVersion: e.sys.publishedVersion,
                        }
                    }));

                    // Extract Asset and Entry IDs recursively from the sample entries
                    const assetIds = new Set<string>();
                    const entryIds = new Set<string>();

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const extractLinks = (obj: any) => {
                        if (!obj || typeof obj !== 'object') return;
                        if (obj.sys?.type === 'Link') {
                            if (obj.sys.linkType === 'Asset' && obj.sys.id) assetIds.add(obj.sys.id);
                            if (obj.sys.linkType === 'Entry' && obj.sys.id) entryIds.add(obj.sys.id);
                        } else if (Array.isArray(obj)) {
                            obj.forEach(extractLinks);
                        } else {
                            Object.values(obj).forEach(extractLinks);
                        }
                    };

                    sample.items.forEach((e) => {
                        if (e.fields) extractLinks(e.fields);
                    });

                    // Fetch those assets explicitly if any
                    const resolvedAssets: Record<string, { url: string; title: string; isImage: boolean }> = {};
                    if (assetIds.size > 0) {
                        try {
                            const assetsResponse = await env.getAssets({
                                'sys.id[in]': Array.from(assetIds).slice(0, 15).join(','), // Fetch max 15
                            });

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            assetsResponse.items.forEach((asset: any) => {
                                const id = asset.sys.id;
                                let imageUrl = '';
                                let contentTypeStr = '';
                                const fileField = asset.fields?.file;

                                if (fileField && typeof fileField === 'object' && fileField !== null) {
                                    if ('url' in fileField && typeof fileField.url === 'string') {
                                        imageUrl = fileField.url;
                                        contentTypeStr = fileField.contentType as string || '';
                                    } else {
                                        const locales = Object.values(fileField);
                                        for (const localeFile of locales) {
                                            if (typeof localeFile === 'object' && localeFile !== null && 'url' in localeFile && typeof localeFile.url === 'string') {
                                                imageUrl = localeFile.url;
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                contentTypeStr = (localeFile as any).contentType || '';
                                                break;
                                            }
                                        }
                                    }
                                }

                                let title = 'Asset';
                                const titleField = asset.fields?.title;
                                if (titleField) {
                                    const titleLocales = Object.values(titleField);
                                    if (titleLocales.length > 0 && typeof titleLocales[0] === 'string') {
                                        title = titleLocales[0];
                                    }
                                }

                                if (imageUrl) {
                                    const finalUrl = imageUrl.startsWith('//')
                                        ? `https:${imageUrl}`
                                        : (imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`);
                                    const isImage = contentTypeStr.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(finalUrl);
                                    resolvedAssets[id] = { url: finalUrl, title, isImage };
                                }
                            });
                        } catch {
                            // Continue without resolved assets
                        }
                    }

                    // Fetch those entries explicitly if any
                    const resolvedEntries: Record<string, { title: string; contentType?: string }> = {};
                    if (entryIds.size > 0) {
                        try {
                            const entriesResponse = await env.getEntries({
                                'sys.id[in]': Array.from(entryIds).slice(0, 20).join(','),
                                limit: 20
                            });

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            entriesResponse.items.forEach((entry: any) => {
                                const id = entry.sys.id;
                                const contentType = entry.sys.contentType?.sys?.id;
                                let title = id;

                                if (entry.fields) {
                                    const fields = entry.fields;
                                    const titleFieldKey = Object.keys(fields).find(k =>
                                        k.toLowerCase().includes('title') ||
                                        k.toLowerCase().includes('name') ||
                                        k.toLowerCase().includes('slug') ||
                                        k.toLowerCase().includes('label')
                                    );

                                    if (titleFieldKey) {
                                        const val = Object.values(fields[titleFieldKey])[0];
                                        if (typeof val === 'string') title = val;
                                    } else {
                                        const firstString = Object.values(fields).find(v => {
                                            if (typeof v === 'object' && v !== null) {
                                                return typeof Object.values(v)[0] === 'string';
                                            }
                                            return false;
                                        });
                                        if (firstString && typeof firstString === 'object' && firstString !== null) {
                                            title = Object.values(firstString)[0] as string;
                                        }
                                    }
                                }
                                resolvedEntries[id] = { title, contentType };
                            });
                        } catch {
                            // Continue without resolved entries
                        }
                    }

                    return {
                        id: ct.sys.id,
                        name: ct.name,
                        description: ct.description ?? '',
                        displayField: ct.displayField ?? null,
                        fields: ct.fields,
                        totalEntries: sample.total,
                        sampleTitles,
                        sampleEntries,
                        resolvedAssets,
                        resolvedEntries,
                    };
                } catch {
                    return {
                        id: ct.sys.id,
                        name: ct.name,
                        description: ct.description ?? '',
                        displayField: ct.displayField ?? null,
                        fields: ct.fields,
                        totalEntries: 0,
                        sampleTitles: [],
                        sampleEntries: [],
                    };
                }
            })
        );

        // Pre-compute CT dependency graph so UI can show auto-deps immediately
        const allCTIds = new Set(contentTypes.map(ct => ct.sys.id));
        const ctDepMap: Record<string, string[]> = {};
        for (const ctId of allCTIds) {
            const { autoDeps } = resolveContentTypeDependencies(new Set([ctId]), contentTypes);
            if (autoDeps.size > 0) {
                ctDepMap[ctId] = Array.from(autoDeps);
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                contentTypes: ctSummaries,
                locales,
                ctDependencyMap: ctDepMap,
                totalContentTypes: contentTypes.length,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch preview',
        });
    }
}
