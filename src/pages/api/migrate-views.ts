import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';

interface View {
    id: string;
    title: string;
    order?: {
        fieldId: string;
        direction: 'ascending' | 'descending';
    };
    displayedFieldIds?: string[];
    contentTypeId: string | null;
    searchText?: string;
    searchFilters?: [string, string, string][];
    roles?: string[];
}

interface ViewFolder {
    id: string;
    title: string;
    views: View[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { spaceId, sourceEnv, targetEnv, selectedViews } = req.body;

    if (!spaceId || !sourceEnv || !targetEnv || !selectedViews) {
        return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user || !user.contentfulToken) {
            return res.status(401).json({ success: false, error: 'Contentful token not set in profile' });
        }

        const token = decrypt(user.contentfulToken);

        const client = ContentfulManagement.getClient(token);
        const space = await client.getSpace(spaceId);

        // Get source environment views
        const sourceEnvironment = await space.getEnvironment(sourceEnv);
        const sourceUIConfig = await sourceEnvironment.getUIConfig();

        // Get target environment UI Config
        const targetEnvironment = await space.getEnvironment(targetEnv);
        const targetUIConfig = await targetEnvironment.getUIConfig();

        // Helper to clone deeply to avoid mutation issues
        const targetFolders: ViewFolder[] = JSON.parse(JSON.stringify(targetUIConfig.entryListViews || []));
        const viewsToMigrate = ((sourceUIConfig.entryListViews || []) as unknown as ViewFolder[]).filter((folder) =>
            selectedViews.includes(folder.id)
        );

        let migratedCount = 0;
        let skippedCount = 0;

        for (const sourceFolder of viewsToMigrate) {
            const targetFolderIndex = targetFolders.findIndex((f) => f.id === sourceFolder.id);

            if (targetFolderIndex === -1) {
                // Folder doesn't exist, add it completely
                targetFolders.push(sourceFolder);
                migratedCount++;
            } else {
                // Folder exists, merge views
                const targetFolder = targetFolders[targetFolderIndex];
                const existingViewIds = new Set((targetFolder.views || []).map((v: View) => v.id));

                const viewsToAdd = (sourceFolder.views || []).filter((v: View) => !existingViewIds.has(v.id));

                if (viewsToAdd.length > 0) {
                    targetFolder.views = [...(targetFolder.views || []), ...viewsToAdd];
                    migratedCount += viewsToAdd.length; // Count individual views migrated
                } else {
                    skippedCount++;
                }
            }
        }

        // Update target UI Config
        targetUIConfig.entryListViews = targetFolders;

        const updatedConfig = await targetUIConfig.update();

        return res.status(200).json({
            success: true,
            data: {
                migratedCount: migratedCount,
                skippedCount: skippedCount,
                totalTargetViews: updatedConfig.entryListViews?.length || 0
            }
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[MigrateViews] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to migrate views',
            data: { details: errorMessage }
        });
    }
}
