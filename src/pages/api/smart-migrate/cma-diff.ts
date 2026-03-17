import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { ContentfulManagement } from '@/utils/contentful-management';
import { resolveContentTypeDependencies } from '@/utils/dependency-resolver';
import type { BackupLocale } from '@/types/backup';
import type {
    DiffStatus, CTDiffItem, LocaleDiffItem, MigrateDiffResult, EntryDiffItem,
} from '@/types/smart-migrate';

export type { DiffStatus, CTDiffItem, LocaleDiffItem, MigrateDiffResult, EntryDiffItem };

/* eslint-disable @typescript-eslint/no-explicit-any */

// Removed entry/asset fetching helpers (fetchAllEntries, resolveTitle, extractLinkIds) as they are moved to lazy-loaded endpoints

/* eslint-enable @typescript-eslint/no-explicit-any */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.contentfulToken) {
        return res.status(400).json({ success: false, error: 'Contentful token not configured' });
    }

    const { sourceSpaceId, sourceEnvId, targetSpaceId, targetEnvId } = req.query as Record<string, string>;
    if (!sourceSpaceId || !sourceEnvId || !targetSpaceId || !targetEnvId) {
        return res.status(400).json({
            success: false,
            error: 'sourceSpaceId, sourceEnvId, targetSpaceId, targetEnvId are required',
        });
    }

    try {
        const token = decrypt(user.contentfulToken);
        const client = ContentfulManagement.getClient(token);

        const [sourceCTs, targetCTs, sourceLocaleItems, targetLocaleItems] = await Promise.all([
            ContentfulManagement.getContentTypes(sourceSpaceId, sourceEnvId, token),
            ContentfulManagement.getContentTypes(targetSpaceId, targetEnvId, token),
            ContentfulManagement.getLocales(sourceSpaceId, sourceEnvId, token),
            ContentfulManagement.getLocales(targetSpaceId, targetEnvId, token),
        ]);

        const isCrossSpace = sourceSpaceId !== targetSpaceId;
        const [srcSpace, tgtSpace] = await Promise.all([
            client.getSpace(sourceSpaceId),
            isCrossSpace ? client.getSpace(targetSpaceId) : client.getSpace(sourceSpaceId),
        ]);

        const [srcEnv, tgtEnv] = await Promise.all([
            srcSpace.getEnvironment(sourceEnvId),
            tgtSpace.getEnvironment(targetEnvId),
        ]);

        const targetCTMap = new Map(targetCTs.map(ct => [ct.sys.id, ct]));
        const sourceCTMap = new Map(sourceCTs.map(ct => [ct.sys.id, ct]));
        let totalNewEntries = 0, totalModifiedEntries = 0, totalDeletedEntries = 0, totalEqualEntries = 0;

        const ctDiffItems: CTDiffItem[] = [];

        for (const srcCT of sourceCTs) {
            const tgtCT = targetCTMap.get(srcCT.sys.id);
            let ctDiffStatus: DiffStatus;
            let changedFields: string[] | undefined;

            if (!tgtCT) {
                ctDiffStatus = 'NEW';
            } else {
                const srcFields = JSON.stringify(srcCT.fields ?? []);
                const tgtFields = JSON.stringify(tgtCT.fields ?? []);
                const srcMeta = `${srcCT.name}|${srcCT.description ?? ''}|${srcCT.displayField ?? ''}`;
                const tgtMeta = `${tgtCT.name}|${tgtCT.description ?? ''}|${tgtCT.displayField ?? ''}`;

                if (srcFields !== tgtFields || srcMeta !== tgtMeta) {
                    ctDiffStatus = 'MODIFIED';
                    const srcFieldIds = new Set((srcCT.fields ?? []).map((f: { id?: string }) => f.id).filter(Boolean));
                    const tgtFieldIds = new Set((tgtCT.fields ?? []).map((f: { id?: string }) => f.id).filter(Boolean));
                    changedFields = [
                        ...[...srcFieldIds].filter(id => !tgtFieldIds.has(id)).map(id => `+${id}`),
                        ...[...tgtFieldIds].filter(id => !srcFieldIds.has(id)).map(id => `-${id}`),
                    ];
                    if (srcMeta !== tgtMeta) changedFields.unshift('~metadata');
                } else {
                    ctDiffStatus = 'EQUAL';
                }
            }

            const entryDiffs: EntryDiffItem[] = [];
            let changedCount = 0, equalCount = 0, deletedCount = 0;
            // Entries will be fetched in a separate lazy-loaded endpoint

            ctDiffItems.push({
                id: srcCT.sys.id, name: srcCT.name, description: srcCT.description ?? '',
                displayField: srcCT.displayField ?? null, fields: srcCT.fields ?? [],
                diffStatus: ctDiffStatus, changedFields,
                totalSourceEntries: 0, totalTargetEntries: 0,
                changedEntryCount: changedCount, equalEntryCount: equalCount, deletedEntryCount: deletedCount,
                entryDiffs,
            });
        }

        for (const tgtCT of targetCTs) {
            if (!sourceCTMap.has(tgtCT.sys.id)) {
                ctDiffItems.push({
                    id: tgtCT.sys.id, name: tgtCT.name, description: tgtCT.description ?? '',
                    displayField: tgtCT.displayField ?? null, fields: tgtCT.fields ?? [],
                    diffStatus: 'DELETED',
                    totalSourceEntries: 0, totalTargetEntries: 0,
                    changedEntryCount: 0, equalEntryCount: 0, deletedEntryCount: 0,
                    entryDiffs: [],
                });
            }
        }

        // Fetch counts for all CTs to know if they have changed entries
        const countsPromises = ctDiffItems.map(async (item) => {
            try {
                const [srcRes, tgtRes] = await Promise.all([
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    item.diffStatus !== 'DELETED' ? (srcEnv as any).getEntries({ content_type: item.id, limit: 0 }) : Promise.resolve({ total: 0 }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    item.diffStatus !== 'NEW' ? (tgtEnv as any).getEntries({ content_type: item.id, limit: 0 }) : Promise.resolve({ total: 0 })
                ]);
                item.totalSourceEntries = srcRes.total;
                item.totalTargetEntries = tgtRes.total;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                // Ignore errors
                item.totalSourceEntries = 0;
                item.totalTargetEntries = 0;
            }
        });
        await Promise.all(countsPromises);

        // Asset and entry preview fetching removed for lazy loading

        const normalize = (l: { code: string; name: string; default?: boolean; fallbackCode?: string | null }): BackupLocale => ({
            code: l.code, name: l.name, default: l.default ?? false, fallbackCode: l.fallbackCode ?? null,
        });

        const sourceLocales = sourceLocaleItems.map(normalize);
        const targetLocales = targetLocaleItems.map(normalize);
        const targetLocaleMap = new Map(targetLocales.map(l => [l.code, l]));
        const sourceLocaleMap = new Map(sourceLocales.map(l => [l.code, l]));
        const localeDiffItems: LocaleDiffItem[] = [];

        for (const srcLocale of sourceLocales) {
            const tgtLocale = targetLocaleMap.get(srcLocale.code);
            let diffStatus: DiffStatus;
            if (!tgtLocale) diffStatus = 'NEW';
            else if (srcLocale.name !== tgtLocale.name || srcLocale.fallbackCode !== tgtLocale.fallbackCode) diffStatus = 'MODIFIED';
            else diffStatus = 'EQUAL';
            localeDiffItems.push({ code: srcLocale.code, name: srcLocale.name, default: srcLocale.default ?? false, fallbackCode: srcLocale.fallbackCode ?? null, diffStatus });
        }
        for (const tgtLocale of targetLocales) {
            if (!sourceLocaleMap.has(tgtLocale.code)) {
                localeDiffItems.push({ code: tgtLocale.code, name: tgtLocale.name, default: tgtLocale.default ?? false, fallbackCode: tgtLocale.fallbackCode ?? null, diffStatus: 'DELETED' });
            }
        }

        const allCTIds = new Set(sourceCTs.map(ct => ct.sys.id));
        const ctDepMap: Record<string, string[]> = {};
        for (const ctId of allCTIds) {
            const { autoDeps } = resolveContentTypeDependencies(new Set([ctId]), sourceCTs);
            if (autoDeps.size > 0) ctDepMap[ctId] = Array.from(autoDeps);
        }

        const summary = {
            newCTs: ctDiffItems.filter(c => c.diffStatus === 'NEW').length,
            modifiedCTs: ctDiffItems.filter(c => c.diffStatus === 'MODIFIED').length,
            deletedCTs: ctDiffItems.filter(c => c.diffStatus === 'DELETED').length,
            equalCTs: ctDiffItems.filter(c => c.diffStatus === 'EQUAL').length,
            newLocales: localeDiffItems.filter(l => l.diffStatus === 'NEW').length,
            modifiedLocales: localeDiffItems.filter(l => l.diffStatus === 'MODIFIED').length,
            deletedLocales: localeDiffItems.filter(l => l.diffStatus === 'DELETED').length,
            newEntries: totalNewEntries,
            modifiedEntries: totalModifiedEntries,
            deletedEntries: totalDeletedEntries,
            equalEntries: totalEqualEntries,
        };

        return res.status(200).json({
            success: true,
            data: { contentTypes: ctDiffItems, locales: localeDiffItems, sourceLocales, targetLocales, ctDependencyMap: ctDepMap, summary } satisfies MigrateDiffResult,
        });
    } catch (error) {
        console.error('[CMA DIFF ERROR]', error);
        return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to compute diff' });
    }
}
