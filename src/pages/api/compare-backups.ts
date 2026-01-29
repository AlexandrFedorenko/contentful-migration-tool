import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface CompareRequest {
    spaceId: string;
    sourceBackup: string;
    targetBackup: string;
}

interface DiffItem {
    id: string;
    contentTypeId: string;
    title: string;
    status: 'NEW' | 'MODIFIED' | 'DELETED';
    sysStatus?: 'Draft' | 'Changed' | 'Published';
    oldValue?: any;
    newValue?: any;
}

interface CompareResponse {
    success: boolean;
    diffs?: DiffItem[];
    sourceAssets?: any[];
    targetAssets?: any[];
    sourceEntries?: any[];
    targetEntries?: any[];
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CompareResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { spaceId, sourceBackup, targetBackup } = req.body as CompareRequest;

    if (!spaceId || !sourceBackup || !targetBackup) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        const backupsDir = path.join(process.cwd(), 'backups', spaceId);
        const sourcePath = path.join(backupsDir, sourceBackup);
        const targetPath = path.join(backupsDir, targetBackup);

        if (!fs.existsSync(sourcePath) || !fs.existsSync(targetPath)) {
            return res.status(404).json({ success: false, error: 'One or both backup files not found' });
        }

        const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
        const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));

        const diffs: DiffItem[] = [];

        // Helper to map entries by ID
        const mapEntries = (entries: any[]) => {
            const map = new Map<string, any>();
            entries.forEach(e => map.set(e.sys.id, e));
            return map;
        };

        // Helper to determine entry status (Draft/Changed/Published)
        const getEntryStatus = (entry: any): 'Draft' | 'Changed' | 'Published' => {
            const version = entry.sys.version;
            const publishedVersion = entry.sys.publishedVersion;

            if (!publishedVersion) {
                return 'Draft'; // Never published
            }
            if (version > publishedVersion + 1) {
                return 'Changed'; // Has unpublished changes
            }
            return 'Published'; // Published and no changes
        };

        const sourceEntriesMap = mapEntries(sourceData.entries || []);
        const targetEntriesMap = mapEntries(targetData.entries || []);

        console.log(`[CompareBackups] Source entries: ${sourceEntriesMap.size}, Target entries: ${targetEntriesMap.size}`);

        // 1. Check for NEW and MODIFIED
        for (const [id, sourceEntry] of sourceEntriesMap) {
            const targetEntry = targetEntriesMap.get(id);
            const title = getEntryTitle(sourceEntry);
            const contentTypeId = sourceEntry.sys.contentType.sys.id;
            const sysStatus = getEntryStatus(sourceEntry);

            if (!targetEntry) {
                diffs.push({
                    id,
                    contentTypeId,
                    title,
                    status: 'NEW',
                    sysStatus,
                    newValue: sourceEntry.fields
                });
            } else {
                // Compare fields
                const changes: Record<string, { oldValue: any, newValue: any }> = {};
                let hasChanges = false;

                // Check fields in Source
                for (const key of Object.keys(sourceEntry.fields)) {
                    const sourceVal = sourceEntry.fields[key];
                    const targetVal = targetEntry.fields[key];

                    if (JSON.stringify(sourceVal) !== JSON.stringify(targetVal)) {
                        changes[key] = { oldValue: targetVal, newValue: sourceVal };
                        hasChanges = true;
                    }
                }

                // Check for fields present in Target but missing in Source (Deleted fields)
                for (const key of Object.keys(targetEntry.fields)) {
                    if (!(key in sourceEntry.fields)) {
                        changes[key] = { oldValue: targetEntry.fields[key], newValue: undefined };
                        hasChanges = true;
                    }
                }

                if (hasChanges) {
                    diffs.push({
                        id,
                        contentTypeId,
                        title,
                        status: 'MODIFIED',
                        sysStatus,
                        oldValue: targetEntry.fields,
                        newValue: sourceEntry.fields
                    });
                }
            }
        }

        // 2. Check for DELETED (In Target but not Source)
        for (const [id, targetEntry] of targetEntriesMap) {
            if (!sourceEntriesMap.has(id)) {
                const sysStatus = getEntryStatus(targetEntry);
                diffs.push({
                    id,
                    contentTypeId: targetEntry.sys.contentType.sys.id,
                    title: getEntryTitle(targetEntry),
                    status: 'DELETED',
                    sysStatus,
                    oldValue: targetEntry.fields
                });
            }
        }

        return res.status(200).json({
            success: true,
            diffs,
            sourceAssets: sourceData.assets || [],
            targetAssets: targetData.assets || [],
            sourceEntries: sourceData.entries || [],
            targetEntries: targetData.entries || []
        });

    } catch (error) {
        console.error('[CompareBackups] Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

// Helper to get title
function getEntryTitle(entry: any): string {
    if (!entry || !entry.fields) return entry?.sys?.id || 'Unknown';
    const fields = entry.fields;

    // Try specific title fields
    const titleField = Object.keys(fields).find(key => {
        const k = key.toLowerCase();
        return k.includes('title') || k.includes('name') || k.includes('label') || k.includes('headline');
    });

    if (titleField) {
        const val = fields[titleField];
        // Handle localized
        if (typeof val === 'object' && val !== null) {
            return Object.values(val)[0] as string;
        }
        return String(val);
    }

    // Fallback to first string field
    for (const key of Object.keys(fields)) {
        const val = fields[key];
        if (typeof val === 'object' && val !== null) {
            const firstVal = Object.values(val)[0];
            if (typeof firstVal === 'string') return firstVal;
        }
    }

    return entry.sys.id;
}
