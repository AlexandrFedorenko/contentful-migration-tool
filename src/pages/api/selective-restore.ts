/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { BackupData, BackupEntry, BackupAsset } from '@/types/backup';
import { ContentfulCLI } from '@/utils/contentful-cli';
import { createClient } from 'contentful-management';
import * as fs from 'fs';
import * as path from 'path';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1gb',
        },
        responseLimit: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    let tempFilePath: string | null = null;

    try {
        const auth = getAuth(req);
        if (!auth.userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { clerkId: auth.userId } });
        if (!user) return res.status(403).json({ success: false, error: 'User not found' });

        const { spaceId, targetEnvironment, backupId, options, backupContent: inlineContent, localeMapping } = req.body;
        if (!spaceId || !targetEnvironment) {
            return res.status(400).json({ success: false, error: 'Missing parameters' });
        }

        if (!user.contentfulToken) return res.status(400).json({ success: false, error: 'Token missing' });
        const token = decrypt(user.contentfulToken);

        // ── 1. Load backup content (inline or from DB) ──────────────────────────
        let backupContent: BackupData;
        if (inlineContent) {
            backupContent = inlineContent as BackupData;
        } else if (backupId) {
            const backupRecord = await prisma.backupRecord.findFirst({
                where: { id: backupId, userId: user.id }
            });
            if (!backupRecord || !backupRecord.content) {
                return res.status(404).json({ success: false, error: 'Backup not found' });
            }
            backupContent = backupRecord.content as unknown as BackupData;
        } else {
            return res.status(400).json({ success: false, error: 'No backup content provided' });
        }

        const selectedLocales = new Set<string>(options?.locales || []);
        const selectedContentTypes = new Set<string>(options?.contentTypes || []);
        const localeMap: Record<string, string> = localeMapping || {};

        // ── 2. Recursive dependency resolution ──────────────────────────────────
        const allEntries: BackupEntry[] = backupContent.entries || [];
        const allAssets: BackupAsset[] = backupContent.assets || [];
        const entryMap = new Map<string, BackupEntry>(allEntries.map(e => [e.sys.id, e]));
        const assetMap = new Map<string, BackupAsset>(allAssets.map(a => [a.sys.id, a]));

        const resolvedEntryIds = new Set<string>();
        const resolvedAssetIds = new Set<string>();

        const scanForLinks = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.sys?.type === 'Link' && obj.sys?.linkType === 'Entry') {
                const id = obj.sys.id;
                if (!resolvedEntryIds.has(id) && entryMap.has(id)) {
                    resolvedEntryIds.add(id);
                    const linked = entryMap.get(id)!;
                    if (linked.fields) scanForLinks(linked.fields);
                }
                return;
            }
            if (obj.sys?.type === 'Link' && obj.sys?.linkType === 'Asset') {
                resolvedAssetIds.add(obj.sys.id);
                return;
            }
            // Rich text node types that reference entries/assets
            if (['embedded-entry-block', 'embedded-entry-inline', 'entry-hyperlink'].includes(obj.nodeType) && obj.data?.target?.sys?.id) {
                const id = obj.data.target.sys.id;
                if (!resolvedEntryIds.has(id) && entryMap.has(id)) {
                    resolvedEntryIds.add(id);
                    const linked = entryMap.get(id)!;
                    if (linked.fields) scanForLinks(linked.fields);
                }
            }
            if (['embedded-asset-block', 'asset-hyperlink'].includes(obj.nodeType) && obj.data?.target?.sys?.id) {
                resolvedAssetIds.add(obj.data.target.sys.id);
            }
            if (Array.isArray(obj)) {
                obj.forEach(scanForLinks);
            } else {
                Object.values(obj).forEach(scanForLinks);
            }
        };

        // Seed from selected content types (or all if none selected)
        let seedEntries = allEntries;
        if (selectedContentTypes.size > 0) {
            seedEntries = allEntries.filter(e => selectedContentTypes.has(e.sys.contentType.sys.id));
        }
        for (const entry of seedEntries) {
            resolvedEntryIds.add(entry.sys.id);
            if (entry.fields) scanForLinks(entry.fields);
        }

        // Build filtered + locale-mapped backup
        // Filter entries and assets
        let filteredEntries = Array.from(resolvedEntryIds).map(id => entryMap.get(id)!).filter(Boolean);
        let filteredAssets = Array.from(resolvedAssetIds).map(id => assetMap.get(id)!).filter(Boolean);

        // Collect all content types referenced by resolved entries
        const referencedCTIds = new Set(filteredEntries.map(e => e.sys.contentType.sys.id));
        const filteredContentTypes = (backupContent.contentTypes || []).filter(ct => referencedCTIds.has(ct.sys.id));

        // Apply locale filtering + mapping to entries
        if (selectedLocales.size > 0 || Object.keys(localeMap).length > 0) {
            filteredEntries = filteredEntries.map(entry => {
                if (!entry.fields) return entry;
                const newFields: Record<string, any> = {};
                for (const [fieldName, fieldLocales] of Object.entries(entry.fields as Record<string, any>)) {
                    if (!fieldLocales || typeof fieldLocales !== 'object') {
                        newFields[fieldName] = fieldLocales;
                        continue;
                    }
                    newFields[fieldName] = {};
                    for (const [locale, value] of Object.entries(fieldLocales)) {
                        if (selectedLocales.size === 0 || selectedLocales.has(locale)) {
                            const targetLocale = localeMap[locale] || locale;
                            newFields[fieldName][targetLocale] = value;
                        }
                    }
                }
                return { ...entry, fields: newFields };
            });

            filteredAssets = filteredAssets.map(asset => {
                if (!asset.fields) return asset;
                const newFields: Record<string, any> = {};
                for (const [fieldName, fieldLocales] of Object.entries(asset.fields as Record<string, any>)) {
                    if (!fieldLocales || typeof fieldLocales !== 'object') {
                        newFields[fieldName] = fieldLocales;
                        continue;
                    }
                    newFields[fieldName] = {};
                    for (const [locale, value] of Object.entries(fieldLocales)) {
                        if (selectedLocales.size === 0 || selectedLocales.has(locale)) {
                            const targetLocale = localeMap[locale] || locale;
                            newFields[fieldName][targetLocale] = value;
                        }
                    }
                }
                return { ...asset, fields: newFields };
            });
        }

        // Deduplicate entries by sys.id (merge locales if duplicates)
        const uniqueEntries = new Map<string, BackupEntry>();
        for (const entry of filteredEntries) {
            if (!uniqueEntries.has(entry.sys.id)) {
                uniqueEntries.set(entry.sys.id, JSON.parse(JSON.stringify(entry)));
            } else {
                const existing = uniqueEntries.get(entry.sys.id)!;
                if (entry.fields) {
                    if (!existing.fields) existing.fields = {};
                    for (const [fieldName, fieldValue] of Object.entries(entry.fields)) {
                        if (!existing.fields[fieldName]) {
                            existing.fields[fieldName] = {};
                        }
                        if (typeof fieldValue === 'object' && fieldValue !== null) {
                            Object.assign(existing.fields[fieldName] as any, fieldValue);
                        } else {
                            existing.fields[fieldName] = fieldValue;
                        }
                    }
                }
            }
        }

        const contentToRestore: BackupData = {
            ...backupContent,
            contentTypes: filteredContentTypes,
            entries: Array.from(uniqueEntries.values()),
            assets: filteredAssets,
        };

        // ── 4. Clear environment (if requested) ─────────────────────────────────
        const shouldClear = options?.clearEnvironment === true || options?.clearEnvironment === 'true';
        if (shouldClear) {
            console.log('[SELECTIVE RESTORE] Clearing environment...');
            const cmaClient = createClient({ accessToken: token });
            const space = await cmaClient.getSpace(spaceId);
            const environment = await space.getEnvironment(targetEnvironment);

            const deleteAll = async (type: 'Entry' | 'Asset' | 'ContentType') => {
                let hasItems = true;
                while (hasItems) {
                    let items: any;
                    if (type === 'Entry') items = await environment.getEntries({ limit: 1000 });
                    else if (type === 'Asset') items = await environment.getAssets({ limit: 1000 });
                    else if (type === 'ContentType') items = await environment.getContentTypes({ limit: 1000 });

                    if (!items?.items?.length) { hasItems = false; break; }
                    for (const item of items.items) {
                        try { if (item.isPublished()) await item.unpublish(); } catch { /* skip */ }
                        try { await item.delete(); } catch { /* skip */ }
                    }
                    await new Promise(r => setTimeout(r, 500));
                }
            };

            await deleteAll('Entry');
            await deleteAll('Asset');
            await deleteAll('ContentType');
            await new Promise(r => setTimeout(r, 3000));
        }

        // Write temp file and restore via CLI
        const backupDir = path.join(process.cwd(), 'backups', spaceId);
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const tempFileName = `temp-selective-restore-${Date.now()}.json`;
        tempFilePath = path.join(backupDir, tempFileName);
        fs.writeFileSync(tempFilePath, JSON.stringify(contentToRestore, null, 2));

        await ContentfulCLI.restoreBackup(
            spaceId,
            tempFileName,
            targetEnvironment,
            token,
            (msg) => console.log(`[SELECTIVE RESTORE CLI] ${msg}`),
            false,
            undefined
        );

        return res.status(200).json({ success: true, data: {} });

    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Restore failed' });
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch { /* skip */ }
        }
    }
}
