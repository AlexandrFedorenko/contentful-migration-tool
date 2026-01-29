import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { ContentfulManagement } from '@/utils/contentful-management';

interface SmartMigrateRequest {
    spaceId: string;
    targetEnv: string;
    sourceBackup: string;
    selectedItems: string[]; // List of Entry IDs to migrate
}

interface SmartMigrateResponse {
    success: boolean;
    deltaBackup?: string;
    created?: number;
    updated?: number;
    published?: number;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SmartMigrateResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { spaceId, targetEnv, sourceBackup, selectedItems } = req.body as SmartMigrateRequest;

    if (!spaceId || !targetEnv || !sourceBackup || !selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ success: false, error: 'Missing required fields or no items selected' });
    }

    try {
        const backupsDir = path.join(process.cwd(), 'backups', spaceId);
        const sourcePath = path.join(backupsDir, sourceBackup);

        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({ success: false, error: 'Source backup file not found' });
        }

        const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));

        // Filter entries based on selectedItems
        const filteredEntries = sourceData.entries.filter((entry: any) => selectedItems.includes(entry.sys.id));

        console.log(`[SmartMigrate] Migrating ${filteredEntries.length} entries to ${targetEnv} using Management API`);

        let createdCount = 0;
        let updatedCount = 0;
        let publishedCount = 0;

        // Use Management API to create/update entries
        const client = ContentfulManagement['getClient']();
        const space = await client.getSpace(spaceId);
        const environment = await space.getEnvironment(targetEnv);

        for (const sourceEntry of filteredEntries) {
            try {
                const entryId = sourceEntry.sys.id;
                const contentTypeId = sourceEntry.sys.contentType.sys.id;

                // Check if entry exists in target
                let targetEntry;
                let isNew = false;
                try {
                    targetEntry = await environment.getEntry(entryId);
                } catch (error) {
                    // Entry doesn't exist, we'll create it
                    isNew = true;
                }

                if (isNew) {
                    // Create new entry
                    console.log(`[SmartMigrate] Creating new entry: ${entryId}`);
                    const newEntry = await environment.createEntryWithId(contentTypeId, entryId, {
                        fields: sourceEntry.fields
                    });
                    createdCount++;
                    targetEntry = newEntry;
                } else {
                    // Update existing entry
                    console.log(`[SmartMigrate] Updating entry: ${entryId}`);
                    if (targetEntry) {
                        targetEntry.fields = sourceEntry.fields;
                        const updatedEntry = await targetEntry.update();
                        updatedCount++;
                        targetEntry = updatedEntry;
                    }
                }

                if (!targetEntry) {
                    console.error(`[SmartMigrate] Failed to create/update entry: ${entryId}`);
                    continue;
                }

                // Determine status in source and replicate it in target
                const sourceVersion = sourceEntry.sys.version;
                const sourcePublishedVersion = sourceEntry.sys.publishedVersion;

                // Status logic:
                // - Draft: publishedVersion is undefined
                // - Published: version === publishedVersion + 1
                // - Changed: version > publishedVersion + 1

                if (!sourcePublishedVersion) {
                    // Source is Draft - leave target as Draft (do nothing)
                    console.log(`[SmartMigrate] Entry ${entryId} left as Draft`);
                } else if (sourceVersion === sourcePublishedVersion + 1) {
                    // Source is Published - publish target
                    try {
                        await targetEntry.publish();
                        publishedCount++;
                        console.log(`[SmartMigrate] Published entry: ${entryId}`);
                    } catch (pubError) {
                        console.error(`[SmartMigrate] Failed to publish entry ${entryId}:`, pubError);
                    }
                } else if (sourceVersion > sourcePublishedVersion + 1) {
                    // Source is Changed (published + has unpublished changes)
                    // We need to create this state in target
                    try {
                        // First, get the entry again to ensure we have latest version
                        const latestEntry = await environment.getEntry(entryId);

                        // Publish it first
                        const publishedEntry = await latestEntry.publish();
                        publishedCount++;
                        console.log(`[SmartMigrate] Published entry: ${entryId}`);

                        // Then update it again to create "Changed" state
                        // (entry already has the new fields from earlier update)
                        // We just need to trigger another update to increment version
                        const changedEntry = await environment.getEntry(entryId);
                        changedEntry.fields = sourceEntry.fields; // Ensure latest fields
                        await changedEntry.update();
                        console.log(`[SmartMigrate] Entry ${entryId} set to Changed status`);
                    } catch (pubError) {
                        console.error(`[SmartMigrate] Failed to set Changed status for entry ${entryId}:`, pubError);
                    }
                }

            } catch (entryError) {
                console.error(`[SmartMigrate] Error processing entry ${sourceEntry.sys.id}:`, entryError);
                // Continue with next entry
            }
        }

        console.log(`[SmartMigrate] Migration complete. Created: ${createdCount}, Updated: ${updatedCount}, Published: ${publishedCount}`);

        return res.status(200).json({
            success: true,
            created: createdCount,
            updated: updatedCount,
            published: publishedCount
        });

    } catch (error) {
        console.error('[SmartMigrate] Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
