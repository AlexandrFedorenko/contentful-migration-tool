import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { spaceId, sourceEnv, targetEnv, selectedViews } = req.body;

    if (!spaceId || !sourceEnv || !targetEnv || !selectedViews) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const client = ContentfulManagement.getClient();
        const space = await client.getSpace(spaceId);

        // Get source environment views
        const sourceEnvironment = await space.getEnvironment(sourceEnv);
        const sourceUIConfig = await sourceEnvironment.getUIConfig();

        // Get target environment UI Config
        const targetEnvironment = await space.getEnvironment(targetEnv);
        const targetUIConfig = await targetEnvironment.getUIConfig();

        // Helper to clone deeply to avoid mutation issues
        const targetFolders = JSON.parse(JSON.stringify(targetUIConfig.entryListViews || []));
        const viewsToMigrate = (sourceUIConfig.entryListViews || []).filter((view: any) =>
            selectedViews.includes(view.id)
        );

        let migratedCount = 0;
        let skippedCount = 0;

        for (const sourceFolder of viewsToMigrate) {
            const targetFolderIndex = targetFolders.findIndex((f: any) => f.id === sourceFolder.id);

            if (targetFolderIndex === -1) {
                // Folder doesn't exist, add it completely
                targetFolders.push(sourceFolder);
                migratedCount++;
            } else {
                // Folder exists, merge views
                const targetFolder = targetFolders[targetFolderIndex];
                const existingViewIds = new Set((targetFolder.views || []).map((v: any) => v.id));

                const viewsToAdd = (sourceFolder.views || []).filter((v: any) => !existingViewIds.has(v.id));

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
            migratedCount: migratedCount,
            skippedCount: skippedCount,
            totalTargetViews: updatedConfig.entryListViews?.length || 0
        });
    } catch (error: any) {
        console.error('[MigrateViews] Error:', error);
        return res.status(500).json({
            error: 'Failed to migrate views',
            details: error.message
        });
    }
}
