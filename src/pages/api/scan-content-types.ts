import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulManagement } from "@/utils/contentful-management";

interface ScanRequest {
    spaceId: string;
    sourceEnvironment: string;
    targetEnvironment: string;
    contentTypeId: string;
}

interface ScanResultItem {
    id: string;
    title: string;
    status: 'changed' | 'new' | 'equal';
    sourceVersion?: number;
    targetVersion?: number;
    sourceUpdatedAt?: string;
    targetUpdatedAt?: string;
}

interface ScanResponse {
    success: boolean;
    items?: ScanResultItem[];
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ScanResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { spaceId, sourceEnvironment, targetEnvironment, contentTypeId } = req.body as ScanRequest;

        if (!spaceId || !sourceEnvironment || !targetEnvironment || !contentTypeId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }


        const sourceIterator = ContentfulManagement.getEntriesIterator(spaceId, sourceEnvironment);
        const targetEntriesMap = new Map<string, any>();

        const targetIterator = ContentfulManagement.getEntriesIterator(spaceId, targetEnvironment);

        for await (const batch of targetIterator) {
            for (const entry of batch) {
                if (entry.sys.contentType.sys.id === contentTypeId) {
                    targetEntriesMap.set(entry.sys.id, entry);
                }
            }
        }

        const results: ScanResultItem[] = [];


        for await (const batch of sourceIterator) {
            for (const sourceEntry of batch) {
                if (sourceEntry.sys.contentType.sys.id !== contentTypeId) continue;

                const targetEntry = targetEntriesMap.get(sourceEntry.sys.id);
                const title = getEntryTitle(sourceEntry);

                if (!targetEntry) {
                    results.push({
                        id: sourceEntry.sys.id,
                        title,
                        status: 'new',
                        sourceVersion: sourceEntry.sys.version,
                        sourceUpdatedAt: sourceEntry.sys.updatedAt
                    });
                } else {
                    const isModified = sourceEntry.sys.version !== targetEntry.sys.version ||
                        sourceEntry.sys.updatedAt !== targetEntry.sys.updatedAt;

                    results.push({
                        id: sourceEntry.sys.id,
                        title,
                        status: isModified ? 'changed' : 'equal',
                        sourceVersion: sourceEntry.sys.version,
                        targetVersion: targetEntry.sys.version,
                        sourceUpdatedAt: sourceEntry.sys.updatedAt,
                        targetUpdatedAt: targetEntry.sys.updatedAt
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            items: results
        });

    } catch (error) {
        console.error('Scan failed:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

function getEntryTitle(entry: any): string {
    if (entry.fields?.title) {
        // Handle localized title
        const titleVal = entry.fields.title;
        if (typeof titleVal === 'string') return titleVal;
        if (typeof titleVal === 'object') return Object.values(titleVal)[0] as string || 'Untitled';
    }
    if (entry.fields?.name) {
        const nameVal = entry.fields.name;
        if (typeof nameVal === 'string') return nameVal;
        if (typeof nameVal === 'object') return Object.values(nameVal)[0] as string || 'Untitled';
    }
    return entry.sys.id;
}
