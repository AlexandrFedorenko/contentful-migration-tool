import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from '@/utils/contentful-cli';
import { RestoreResponse } from '@/types/api';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from 'contentful-management';
import { ContentfulManagement } from '@/utils/contentful-management';

interface RestoreRequest {
    spaceId: string;
    fileName: string;
    targetEnvironment: string;
    fileContent?: any;
    clearEnvironment?: boolean;
    options?: {
        locales?: string[];
        contentTypes?: string[];
    };
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};


function filterBackupContent(content: any, options: { locales?: string[]; contentTypes?: string[] }): any {
    const filtered = { ...content };


    if (options.locales && options.locales.length > 0) {
        filtered.locales = filtered.locales?.filter((locale: any) =>
            options.locales!.includes(locale.code)
        );
    }


    if (options.contentTypes && options.contentTypes.length > 0) {
        filtered.contentTypes = filtered.contentTypes?.filter((ct: any) =>
            options.contentTypes!.includes(ct.sys.id)
        );


        filtered.entries = filtered.entries?.filter((entry: any) =>
            options.contentTypes!.includes(entry.sys.contentType.sys.id)
        );


        if (filtered.editorInterfaces) {
            filtered.editorInterfaces = filtered.editorInterfaces.filter((ei: any) =>
                options.contentTypes!.includes(ei.sys.contentType.sys.id)
            );
        }
    }


    if (options.contentTypes && options.contentTypes.length > 0 && filtered.entries && content.entries) {
        const usedAssetIds = new Set<string>();
        const usedEntryIds = new Set<string>(filtered.entries.map((e: any) => e.sys.id));
        const entriesMap = new Map(content.entries.map((e: any) => [e.sys.id, e]));
        const entriesQueue = [...filtered.entries];

        const processEntry = (entry: any) => {
            const traverse = (obj: any) => {
                if (!obj || typeof obj !== 'object') return;

                if (Array.isArray(obj)) {
                    obj.forEach(traverse);
                    return;
                }


                if (obj.sys && obj.sys.type === 'Link' && obj.sys.linkType === 'Asset') {
                    usedAssetIds.add(obj.sys.id);
                }


                if (obj.sys && obj.sys.type === 'Link' && obj.sys.linkType === 'Entry') {
                    const linkedEntryId = obj.sys.id;
                    if (!usedEntryIds.has(linkedEntryId)) {
                        const linkedEntry = entriesMap.get(linkedEntryId);
                        if (linkedEntry) {
                            usedEntryIds.add(linkedEntryId);
                            entriesQueue.push(linkedEntry); // Add to queue to process ITS dependencies
                            filtered.entries.push(linkedEntry); // Add to result list
                        }
                    }
                }


                if (obj.nodeType === 'embedded-asset-block' && obj.data?.target?.sys?.id) {
                    usedAssetIds.add(obj.data.target.sys.id);
                }
                if ((obj.nodeType === 'embedded-entry-block' || obj.nodeType === 'embedded-entry-inline') && obj.data?.target?.sys?.id) {
                    const linkedEntryId = obj.data.target.sys.id;
                    if (!usedEntryIds.has(linkedEntryId)) {
                        const linkedEntry = entriesMap.get(linkedEntryId);
                        if (linkedEntry) {
                            usedEntryIds.add(linkedEntryId);
                            entriesQueue.push(linkedEntry);
                            filtered.entries.push(linkedEntry);
                        }
                    }
                }

                Object.values(obj).forEach(traverse);
            };


            if (entry.fields) {
                traverse(entry.fields);
            }
        };


        let processedIndex = 0;
        while (processedIndex < entriesQueue.length) {
            processEntry(entriesQueue[processedIndex]);
            processedIndex++;
        }




        if (filtered.assets) {
            const originalCount = filtered.assets.length;
            filtered.assets = filtered.assets.filter((asset: any) => usedAssetIds.has(asset.sys.id));

        }


        const requiredContentTypeIds = new Set<string>();
        filtered.entries.forEach((entry: any) => {
            if (entry.sys?.contentType?.sys?.id) {
                requiredContentTypeIds.add(entry.sys.contentType.sys.id);
            }
        });



        if (content.contentTypes) {
            filtered.contentTypes = content.contentTypes.filter((ct: any) =>
                requiredContentTypeIds.has(ct.sys.id)
            );
        }

        if (content.editorInterfaces) {
            filtered.editorInterfaces = content.editorInterfaces.filter((ei: any) =>
                requiredContentTypeIds.has(ei.sys.contentType.sys.id)
            );
        }
    }


    if (options.locales && options.locales.length > 0) {
        const allowedLocales = new Set(options.locales);

        const stripLocales = (item: any) => {
            if (item.fields) {
                Object.keys(item.fields).forEach(fieldName => {
                    const field = item.fields[fieldName];
                    if (field && typeof field === 'object') {
                        Object.keys(field).forEach(locale => {
                            if (!allowedLocales.has(locale)) {
                                delete field[locale];
                            }
                        });
                    }
                });
            }
        };

        if (filtered.entries) filtered.entries.forEach(stripLocales);
        if (filtered.assets) filtered.assets.forEach(stripLocales);
    }

    return filtered;
}


function transformBackupLocales(content: any, fromLocale: string, toLocale: string) {



    const newContent = JSON.parse(JSON.stringify(content));


    if (newContent.locales) {
        newContent.locales = newContent.locales.map((loc: any) => {
            if (loc.code === fromLocale) {
                return { ...loc, code: toLocale };
            }
            return loc;
        });
    }


    if (newContent.entries) {
        newContent.entries.forEach((entry: any) => {
            if (entry.fields) {
                Object.keys(entry.fields).forEach(fieldName => {
                    const field = entry.fields[fieldName];
                    if (field[fromLocale] !== undefined) {
                        field[toLocale] = field[fromLocale];
                        delete field[fromLocale];
                    }
                });
            }
        });
    }


    if (newContent.assets) {
        newContent.assets.forEach((asset: any) => {
            if (asset.fields) {
                Object.keys(asset.fields).forEach(fieldName => {
                    const field = asset.fields[fieldName];
                    if (field[fromLocale] !== undefined) {
                        field[toLocale] = field[fromLocale];
                        delete field[fromLocale];
                    }
                });
            }
        });
    }


    if (newContent.contentTypes) {
        newContent.contentTypes.forEach((ct: any) => {
            if (ct.fields) {
                ct.fields.forEach((field: any) => {
                    if (field.defaultValue && typeof field.defaultValue === 'object') {
                        Object.keys(field.defaultValue).forEach(locale => {
                            if (locale === fromLocale) {
                                field.defaultValue[toLocale] = field.defaultValue[fromLocale];
                                delete field.defaultValue[fromLocale];
                            }
                        });
                    }
                });
            }
        });
    }

    return newContent;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RestoreResponse>
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    const { spaceId, fileName, targetEnvironment, options, fileContent, clearEnvironment }: RestoreRequest = req.body;

    if (!spaceId || !fileName || !targetEnvironment) {
        return res.status(400).json({
            success: false,
            error: "Space ID, file name and target environment are required"
        });
    }

    let tempFilePath: string | null = null;

    try {

        if (clearEnvironment) {
            const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
            if (!token) {
                throw new Error("Management token not found. Please log in again.");
            }

            const client = createClient({ accessToken: token });
            const space = await client.getSpace(spaceId);
            const environment = await space.getEnvironment(targetEnvironment);


            const entries = await environment.getEntries({ limit: 1000 });
            for (const entry of entries.items) {
                if (entry.isPublished()) {
                    await entry.unpublish();
                }
                await entry.delete();
            }


            const assets = await environment.getAssets({ limit: 1000 });
            for (const asset of assets.items) {
                if (asset.isPublished()) {
                    await asset.unpublish();
                }
                await asset.delete();
            }


            const contentTypes = await environment.getContentTypes({ limit: 1000 });
            for (const ct of contentTypes.items) {
                if (ct.isPublished()) {
                    await ct.unpublish();
                }
                await ct.delete();
            }


        }

        let fileToRestore = fileName;
        let backupContent: any = null;


        if (fileContent) {

            backupContent = typeof fileContent === 'string'
                ? JSON.parse(fileContent)
                : fileContent;
        } else if (options && (options.locales || options.contentTypes)) {

            const backupFilePath = path.join(process.cwd(), 'backups', spaceId, fileName);

            if (!fs.existsSync(backupFilePath)) {
                throw new Error(`Backup file not found: ${backupFilePath}`);
            }

            backupContent = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
        }


        if (backupContent && options && (options.locales || options.contentTypes)) {
            backupContent = filterBackupContent(backupContent, options);
        }


        if (backupContent) {
            try {
                const targetLocales = await ContentfulManagement.getLocales(spaceId, targetEnvironment);
                const targetDefaultLocale = targetLocales.find((l: any) => l.default)?.code;



                const sourceDefaultLocale = backupContent.locales?.find((l: any) => l.default)?.code;

                if (targetDefaultLocale && sourceDefaultLocale && targetDefaultLocale !== sourceDefaultLocale) {

                    backupContent = transformBackupLocales(backupContent, sourceDefaultLocale, targetDefaultLocale);
                }
            } catch (error) {
                console.warn('[RESTORE] Failed to check/transform locales:', error);
                // Continue anyway, maybe it works or fails with CLI error
            }
        }


        if (backupContent) {
            const tempFileName = `temp-filtered-${Date.now()}-${fileName}`;
            const backupDir = path.join(process.cwd(), 'backups', spaceId);

            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            tempFilePath = path.join(backupDir, tempFileName);

            fs.writeFileSync(tempFilePath, JSON.stringify(backupContent, null, 2));
            fileToRestore = tempFileName;
        } else {

        }



        const restoreResult = await ContentfulCLI.restoreBackup(
            spaceId,
            fileToRestore,
            targetEnvironment,

        );



        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        return res.status(200).json({
            success: true
        });
    } catch (error) {

        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch { }
        }

        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to restore backup'
        });
    }
}
