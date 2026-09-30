import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { getActiveToken } from '@/server/contentful/credentials';
import { environmentId, spaceId } from '@/server/validation';
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

const Body = z.object({
    spaceId,
    sourceEnv: environmentId,
    targetEnv: environmentId,
    selectedViews: z.array(z.string().max(100)).min(1).max(500),
});

/** POST /api/migrate-views — merge selected entry list view folders into another environment. */
export default createApiHandler({
    POST: route({
        body: Body,
        rateLimit: { limit: 20, windowSeconds: 60 },
        handler: async (_req, _res, { user, body }) => {
            const token = await getActiveToken(user.id);
            const client = ContentfulManagement.getClient(token);
            const space = await client.getSpace(body.spaceId);

            // Get source environment views
            const sourceEnvironment = await space.getEnvironment(body.sourceEnv);
            const sourceUIConfig = await sourceEnvironment.getUIConfig();

            // Get target environment UI Config
            const targetEnvironment = await space.getEnvironment(body.targetEnv);
            const targetUIConfig = await targetEnvironment.getUIConfig();

            // Helper to clone deeply to avoid mutation issues
            const targetFolders: ViewFolder[] = JSON.parse(JSON.stringify(targetUIConfig.entryListViews || []));
            const viewsToMigrate = ((sourceUIConfig.entryListViews || []) as unknown as ViewFolder[]).filter((folder) =>
                body.selectedViews.includes(folder.id)
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

            return {
                migratedCount,
                skippedCount,
                totalTargetViews: updatedConfig.entryListViews?.length || 0,
            };
        },
    }),
});
