import { BackupData, BackupEntry, BackupAsset, BackupLocale, BackupContentType } from "@/types/backup";

export function filterBackupContent(content: BackupData, options: { locales?: string[]; contentTypes?: string[]; clearEnvironment?: boolean | string }): BackupData {
    // START WITH EMPTY DOCUMENT AND ADD ONLY WHAT IS NEEDED
    // We cast to any for the initial setup to allow incrementally building the strict BackupData structure
    // but ensuring the arrays are initialized prevents 'undefined' errors later
    const filtered: BackupData = {
        sys: content.sys,
        entries: [],
        assets: [],
        locales: [],
        contentTypes: [],
        editorInterfaces: []
    };

    // 1. Filter Locales
    if (options.locales && options.locales.length > 0 && content.locales) {
        filtered.locales = content.locales.filter((locale: BackupLocale) =>
            options.locales!.includes(locale.code)
        );
    } else {
        filtered.locales = content.locales || [];
    }

    // Helper to strip locales from a single item (entry or asset)
    // Returns a NEW object with filtered fields, does not mutate original
    const stripItemLocales = <T extends BackupEntry | BackupAsset>(item: T, allowedLocales: Set<string>): T => {
        if (!item.fields) return { ...item }; // Shallow copy if no fields

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newItem = { ...item, fields: {} as any };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.keys((item as any).fields).forEach((fieldName: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const field = (item as any).fields[fieldName];
            if (field && typeof field === 'object') {
                const newField: Record<string, unknown> = {};
                let hasValue = false;
                Object.keys(field).forEach(locale => {
                    if (allowedLocales.has(locale)) {
                        newField[locale] = (field as Record<string, unknown>)[locale];
                        hasValue = true;
                    }
                });
                if (hasValue || Object.keys(field).length === 0) {
                    newItem.fields[fieldName] = newField;
                }
            } else {
                newItem.fields[fieldName] = field;
            }
        });
        return newItem as T;
    };

    // 2. Filter Entries & Resolve Dependencies
    if (options.contentTypes && options.contentTypes.length > 0) {
        // Initial set of entries based on selected Content Types
        const rawStartingEntries = content.entries?.filter((entry: BackupEntry) =>
            options.contentTypes!.includes(entry.sys.contentType.sys.id)
        ) || [];

        const usedEntryIds = new Set<string>();
        const usedAssetIds = new Set<string>();
        const entriesMap = new Map(content.entries?.map((e: BackupEntry) => [e.sys.id, e]) || []);
        const assetsMap = new Map(content.assets?.map((a: BackupAsset) => [a.sys.id, a]) || []);

        // Allowed locales set
        const allowedLocales = options.locales && options.locales.length > 0
            ? new Set<string>(options.locales)
            : new Set<string>(content.locales?.map((l: BackupLocale) => l.code) || []);



        const processingQueue: (BackupEntry | BackupAsset)[] = [];

        // Add starting entries - BUT CLEAN THEM FIRST
        // We only want to traverse links that exist in the SELECTED locales.
        rawStartingEntries.forEach((e: BackupEntry) => {
            if (!usedEntryIds.has(e.sys.id)) {
                usedEntryIds.add(e.sys.id);
                const cleanedEntry = stripItemLocales(e, allowedLocales);
                filtered.entries!.push(cleanedEntry);
                processingQueue.push(cleanedEntry);
            }
        });

        let processedIndex = 0;
        while (processedIndex < processingQueue.length) {
            const entry = processingQueue[processedIndex];
            processedIndex++;

            // Traverse fields to find links
            // checks ONLY the fields present in 'entry' which is already cleaned
            const traverse = (obj: unknown) => {
                if (!obj || typeof obj !== 'object') return;
                // Define a structural type for the node to avoid 'any' while accessing dynamic properties
                type ContentfulNode = {
                    sys?: { type?: string; linkType?: string; id?: string };
                    nodeType?: string;
                    data?: { target?: { sys?: { id?: string } } };
                    content?: unknown[];
                    marks?: unknown[];
                    value?: string;
                };
                const node = obj as ContentfulNode;

                // Array handling
                if (Array.isArray(obj)) {
                    obj.forEach(traverse);
                    return;
                }

                // Direct Links
                if (node.sys && node.sys.type === 'Link') {
                    if (node.sys.linkType === 'Asset') {
                        const assetId = node.sys.id;
                        if (assetId && !usedAssetIds.has(assetId)) {
                            const asset = assetsMap.get(assetId);
                            if (asset) {
                                usedAssetIds.add(assetId);
                                const cleanedAsset = stripItemLocales(asset, allowedLocales);
                                filtered.assets!.push(cleanedAsset);
                            }
                        }
                    } else if (node.sys.linkType === 'Entry') {
                        const entryId = node.sys.id;
                        if (entryId && !usedEntryIds.has(entryId)) {
                            const linkedEntry = entriesMap.get(entryId);
                            if (linkedEntry) {
                                usedEntryIds.add(entryId);
                                const cleanedEntry = stripItemLocales(linkedEntry, allowedLocales);
                                filtered.entries!.push(cleanedEntry);
                                processingQueue.push(linkedEntry);
                            }
                        }
                    }
                }

                // Rich Text Links (Embedded)
                if (node.nodeType) {
                    if ((node.nodeType === 'embedded-asset-block' || node.nodeType === 'asset-hyperlink') && node.data?.target?.sys?.id) {
                        const assetId = node.data.target.sys.id;
                        if (assetId && !usedAssetIds.has(assetId)) {
                            const asset = assetsMap.get(assetId);
                            if (asset) {
                                usedAssetIds.add(assetId);
                                const cleanedAsset = stripItemLocales(asset, allowedLocales);
                                filtered.assets!.push(cleanedAsset);
                            }
                        }
                    }
                    if ((node.nodeType === 'embedded-entry-block' || node.nodeType === 'embedded-entry-inline' || node.nodeType === 'entry-hyperlink') && node.data?.target?.sys?.id) {
                        const entryId = node.data.target.sys.id;
                        if (entryId && !usedEntryIds.has(entryId)) {
                            const linkedEntry = entriesMap.get(entryId);
                            if (linkedEntry) {
                                usedEntryIds.add(entryId);
                                const cleanedEntry = stripItemLocales(linkedEntry, allowedLocales);
                                filtered.entries!.push(cleanedEntry);
                                processingQueue.push(linkedEntry);
                            }
                        }
                    }
                }

                Object.values(obj).forEach(traverse);
            };

            if (entry.fields) traverse(entry.fields);
        }

        // 3. Resolve Content Types and Editor Interfaces based on resolved entries
        const requiredContentTypeIds = new Set<string>();
        filtered.entries!.forEach((entry: BackupEntry) => {
            if (entry.sys?.contentType?.sys?.id) requiredContentTypeIds.add(entry.sys.contentType.sys.id);
        });

        if (content.contentTypes) {
            filtered.contentTypes = content.contentTypes.filter((ct: BackupContentType) => requiredContentTypeIds.has(ct.sys.id));
        }
        if (content.editorInterfaces) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            filtered.editorInterfaces = content.editorInterfaces.filter((ei: any) =>
                requiredContentTypeIds.has(ei.sys.contentType.sys.id)
            );
        }



    } else {
        // No content type filtering - keep everything
        // But still filter locales if requested!

        const allowedLocales = options.locales && options.locales.length > 0
            ? new Set<string>(options.locales)
            : null;

        if (allowedLocales) {
            filtered.entries = content.entries?.map((e: BackupEntry) => stripItemLocales(e, allowedLocales)) || [];
            filtered.assets = content.assets?.map((a: BackupAsset) => stripItemLocales(a, allowedLocales)) || [];
        } else {
            filtered.entries = content.entries || [];
            filtered.assets = content.assets || [];
        }

        filtered.contentTypes = content.contentTypes || [];
        filtered.editorInterfaces = content.editorInterfaces || [];
    }

    // Locales are already stripped above

    return filtered;
}

// Helper to strip locales not in target
export function cleanupBackupLocales(content: BackupData, allowedLocales: Set<string>) {
    const strip = (items: (BackupEntry | BackupAsset)[]) => {
        items?.forEach((item: BackupEntry | BackupAsset) => {
            if (item.fields) {
                Object.keys(item.fields).forEach(fieldName => {
                    const field = (item.fields as Record<string, unknown>)[fieldName];
                    if (field && typeof field === 'object') {
                        Object.keys(field).forEach(locale => {
                            if (!allowedLocales.has(locale)) delete (field as Record<string, unknown>)[locale];
                        });
                    }
                });
            }
        });
    };

    if (content.entries) strip(content.entries);
    if (content.assets) strip(content.assets);

    // Also cleanup content type default values
    if (content.contentTypes) {
        content.contentTypes.forEach((ct: BackupContentType) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ct.fields?.forEach((f: any) => {
                if (f.defaultValue) {
                    Object.keys(f.defaultValue).forEach(locale => {
                        if (!allowedLocales.has(locale)) delete f.defaultValue[locale];
                    });
                }
            });
        });
    }

    // Filter top-level locales array
    if (content.locales) {
        content.locales = content.locales.filter((l: BackupLocale) => allowedLocales.has(l.code));
    }

    return content;
}

export function transformBackupLocales(content: BackupData, mapping: Record<string, string>): BackupData {
    const newContent = JSON.parse(JSON.stringify(content));

    // 1. Transform top-level locales array
    if (newContent.locales) {
        newContent.locales = newContent.locales.map((loc: BackupLocale) => {
            if (mapping[loc.code]) {
                return { ...loc, code: mapping[loc.code] };
            }
            return loc;
        });
    }



    // Transform locale keys while preserving field content structure
    // This is critical for reference fields grouped by locale (e.g., buttons in footer)
    const safeTransformFields = (items: (BackupEntry | BackupAsset)[]) => {
        items?.forEach((item: BackupEntry | BackupAsset) => {
            if (item.fields) {
                const itemFields = item.fields as Record<string, unknown>;
                Object.keys(itemFields).forEach(fieldName => {
                    const fieldsRecord = itemFields;
                    const oldField = fieldsRecord[fieldName];
                    if (oldField && typeof oldField === 'object') {
                        const newField: Record<string, unknown> = {};
                        // Simply rename locale keys, keep content intact
                        Object.keys(oldField).forEach(sourceLocale => {
                            const targetLocale = mapping[sourceLocale] || sourceLocale;
                            newField[targetLocale] = (oldField as Record<string, unknown>)[sourceLocale];
                        });
                        fieldsRecord[fieldName] = newField;
                    }
                });
            }
        });
    };

    if (newContent.entries) safeTransformFields(newContent.entries);
    if (newContent.assets) safeTransformFields(newContent.assets);

    // Transform content type default values
    // Transform content type default values
    if (newContent.contentTypes) {
        newContent.contentTypes.forEach((ct: BackupContentType) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ct.fields?.forEach((field: any) => {
                if (field.defaultValue) {
                    const newDefaultValue: Record<string, unknown> = { ...field.defaultValue };
                    Object.keys(field.defaultValue).forEach(sourceLocale => {
                        if (mapping[sourceLocale]) {
                            const targetLocale = mapping[sourceLocale];
                            if (targetLocale !== sourceLocale) {
                                newDefaultValue[targetLocale] = field.defaultValue[sourceLocale];
                                delete newDefaultValue[sourceLocale];
                            }
                        }
                    });
                    field.defaultValue = newDefaultValue;
                }
            });
        });
    }

    return newContent;
}
