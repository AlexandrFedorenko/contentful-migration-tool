import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { ContentfulManagement } from '@/utils/contentful-management';

interface SmartMigrateRequest {
    spaceId: string;
    targetEnv: string;
    sourceBackup: string;
    selectedItems: string[]; // List of Entry IDs to migrate
    selectedLocales?: string[]; // List of locale codes to migrate
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

    const { spaceId, targetEnv, sourceBackup, selectedItems, selectedLocales } = req.body as SmartMigrateRequest;

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

        // Filter selected entries
        const filteredEntries = sourceData.entries.filter((entry: any) => selectedItems.includes(entry.sys.id));

        // Collect required content types for selected entries
        const requiredContentTypeIds = new Set<string>();
        filteredEntries.forEach((entry: any) => {
            if (entry.sys?.contentType?.sys?.id) {
                requiredContentTypeIds.add(entry.sys.contentType.sys.id);
            }
        });

        // Recursively find all dependent content types
        const findDependentContentTypes = (ctId: string, visited: Set<string> = new Set()): Set<string> => {
            if (visited.has(ctId)) return visited;
            visited.add(ctId);

            const contentType = sourceData.contentTypes?.find((ct: any) => ct.sys.id === ctId);
            if (!contentType) return visited;

            // Check each field for references to other content types
            contentType.fields?.forEach((field: any) => {
                if (field.type === 'Link' && field.linkType === 'Entry') {
                    // Check validations for linkContentType
                    field.validations?.forEach((validation: any) => {
                        if (validation.linkContentType) {
                            validation.linkContentType.forEach((linkedCtId: string) => {
                                if (!visited.has(linkedCtId)) {
                                    findDependentContentTypes(linkedCtId, visited);
                                }
                            });
                        }
                    });
                } else if (field.type === 'Array' && field.items?.type === 'Link' && field.items?.linkType === 'Entry') {
                    // Array of links
                    field.items.validations?.forEach((validation: any) => {
                        if (validation.linkContentType) {
                            validation.linkContentType.forEach((linkedCtId: string) => {
                                if (!visited.has(linkedCtId)) {
                                    findDependentContentTypes(linkedCtId, visited);
                                }
                            });
                        }
                    });
                }
            });

            return visited;
        };

        // Expand required content types to include dependencies
        const allRequiredContentTypes = new Set<string>();
        requiredContentTypeIds.forEach(ctId => {
            const deps = findDependentContentTypes(ctId);
            deps.forEach(depId => allRequiredContentTypes.add(depId));
        });

        console.log('[SmartMigrate] Required content types (including dependencies):', Array.from(allRequiredContentTypes));


        let createdCount = 0;
        let updatedCount = 0;
        let publishedCount = 0;

        const client = ContentfulManagement['getClient']();
        const space = await client.getSpace(spaceId);
        const environment = await space.getEnvironment(targetEnv);

        // Step 1: Ensure all required content types exist in target
        for (const ctId of allRequiredContentTypes) {
            try {
                await environment.getContentType(ctId);
                console.log(`[SmartMigrate] ✓ Content type ${ctId} exists in target`);
            } catch (error) {
                // Content type doesn't exist, create it
                console.log(`[SmartMigrate] Content type ${ctId} not found in target, creating...`);
                const sourceContentType = sourceData.contentTypes?.find((ct: any) => ct.sys.id === ctId);

                if (sourceContentType) {
                    try {
                        const newCt = await environment.createContentTypeWithId(ctId, {
                            name: sourceContentType.name,
                            description: sourceContentType.description,
                            displayField: sourceContentType.displayField,
                            fields: sourceContentType.fields
                        });

                        // Publish the content type
                        await newCt.publish();
                        console.log(`[SmartMigrate] ✓ Content type ${ctId} created and published`);
                    } catch (createError) {
                        console.error(`[SmartMigrate] Failed to create content type ${ctId}:`, createError);
                        throw new Error(`Failed to create required content type: ${ctId}`);
                    }
                } else {
                    throw new Error(`Content type ${ctId} not found in source backup`);
                }
            }
        }

        // Step 2: Migrate entries

        for (const sourceEntry of filteredEntries) {
            try {
                const entryId = sourceEntry.sys.id;
                const contentTypeId = sourceEntry.sys.contentType.sys.id;

                console.log(`[SmartMigrate] Processing entry ${entryId} (${contentTypeId})...`);

                let targetEntry;
                let isNew = false;
                try {
                    targetEntry = await environment.getEntry(entryId);
                    console.log(`[SmartMigrate] Entry ${entryId} exists in target, will update`);
                } catch (error) {
                    // Entry doesn't exist, we'll create it
                    isNew = true;
                    console.log(`[SmartMigrate] Entry ${entryId} does not exist in target, will create`);
                }

                if (isNew) {
                    // Filter fields by selected locales
                    let fields = sourceEntry.fields;
                    if (selectedLocales && selectedLocales.length > 0) {
                        fields = filterFieldsByLocales(sourceEntry.fields, selectedLocales);
                        console.log(`[SmartMigrate] Filtered fields to locales:`, selectedLocales);
                    }

                    console.log(`[SmartMigrate] Creating entry ${entryId} with fields:`, JSON.stringify(fields, null, 2));
                    const newEntry = await environment.createEntryWithId(contentTypeId, entryId, {
                        fields
                    });
                    createdCount++;
                    targetEntry = newEntry;
                    console.log(`[SmartMigrate] ✓ Entry ${entryId} created successfully`);
                } else {
                    // Update existing entry
                    // Filter fields by selected locales
                    let fields = sourceEntry.fields;
                    if (selectedLocales && selectedLocales.length > 0) {
                        fields = filterFieldsByLocales(sourceEntry.fields, selectedLocales);
                    }

                    if (targetEntry) {
                        targetEntry.fields = fields;
                        const updatedEntry = await targetEntry.update();
                        updatedCount++;
                        targetEntry = updatedEntry;
                        console.log(`[SmartMigrate] ✓ Entry ${entryId} updated successfully`);
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

                } else if (sourceVersion === sourcePublishedVersion + 1) {
                    // Source is Published - publish target
                    try {
                        await targetEntry.publish();
                        publishedCount++;

                    } catch (pubError) {
                        console.error(`[SmartMigrate] Failed to publish entry ${entryId}:`, pubError);
                    }
                } else if (sourceVersion > sourcePublishedVersion + 1) {
                    // Source is Changed (published + has unpublished changes)
                    // We need to create this state in target
                    try {

                        const latestEntry = await environment.getEntry(entryId);


                        const publishedEntry = await latestEntry.publish();
                        publishedCount++;


                        // Then update it again to create "Changed" state
                        // (entry already has the new fields from earlier update)
                        // We just need to trigger another update to increment version
                        const changedEntry = await environment.getEntry(entryId);
                        changedEntry.fields = sourceEntry.fields; // Ensure latest fields
                        await changedEntry.update();

                    } catch (pubError) {
                        console.error(`[SmartMigrate] Failed to set Changed status for entry ${entryId}:`, pubError);
                    }
                }

            } catch (entryError) {
                console.error(`[SmartMigrate] Error processing entry ${sourceEntry.sys.id}:`, entryError);
                // Continue with next entry
            }
        }



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

// Helper function to filter entry fields by selected locales
function filterFieldsByLocales(fields: any, selectedLocales: string[]): any {
    const filtered: any = {};
    const allowedLocales = new Set(selectedLocales);

    for (const fieldName in fields) {
        const field = fields[fieldName];
        if (field && typeof field === 'object') {
            filtered[fieldName] = {};
            for (const locale in field) {
                if (allowedLocales.has(locale)) {
                    filtered[fieldName][locale] = field[locale];
                }
            }
        } else {
            filtered[fieldName] = field;
        }
    }

    return filtered;
}
