import { useState, useCallback, SyntheticEvent, useEffect } from "react";
import { useRouter } from "next/router";

export enum TabIndex {
    OVERVIEW = 0,
    CLI_INSTALLATION,
    COMMAND_LINE,
    ERRORS_SOLUTIONS,
    CREATE_BACKUP,
    RESTORE_BACKUP,
    SMART_RESTORE,
    SMART_MIGRATE,
    VISUAL_BUILDER,
    VIEWS_MIGRATE,
    BACKUPS,
    CONTENTFUL_TOKEN
}

export const TAB_SLUGS: Record<TabIndex, string> = {
    [TabIndex.OVERVIEW]: 'overview',
    [TabIndex.CLI_INSTALLATION]: 'cli-installation',
    [TabIndex.COMMAND_LINE]: 'command-line',
    [TabIndex.ERRORS_SOLUTIONS]: 'errors-solutions',
    [TabIndex.CREATE_BACKUP]: 'create-backup',
    [TabIndex.RESTORE_BACKUP]: 'restore-backup',
    [TabIndex.SMART_RESTORE]: 'smart-restore',
    [TabIndex.SMART_MIGRATE]: 'smart-migrate',
    [TabIndex.VISUAL_BUILDER]: 'visual-builder',
    [TabIndex.VIEWS_MIGRATE]: 'views-migrate',
    [TabIndex.BACKUPS]: 'backups',
    [TabIndex.CONTENTFUL_TOKEN]: 'contentful-token',
};

// Reverse mapping for lookup
const SLUG_TO_INDEX: Record<string, TabIndex> = Object.entries(TAB_SLUGS).reduce((acc, [index, slug]) => {
    acc[slug] = Number(index) as TabIndex;
    return acc;
}, {} as Record<string, TabIndex>);


interface UseDocumentationTabsReturn {
    tabIndex: TabIndex;
    handleTabChange: (event: SyntheticEvent | null, newIndex: number) => void;
}

export function useDocumentationTabs(defaultIndex: TabIndex = TabIndex.OVERVIEW): UseDocumentationTabsReturn {
    const router = useRouter();
    const [tabIndex, setTabIndex] = useState<TabIndex>(defaultIndex);

    // Sync tab with URL query param on mount and update
    useEffect(() => {
        if (router.isReady) {
            const tabParam = router.query.tab;

            if (tabParam) {
                // Check if it's a slug string
                if (typeof tabParam === 'string' && tabParam in SLUG_TO_INDEX) {
                    setTabIndex(SLUG_TO_INDEX[tabParam]);
                }
                // Fallback for legacy numeric indexes (optional, but good for backward compat if bookmarks exist)
                else if (!isNaN(Number(tabParam))) {
                    const index = Number(tabParam);
                    if (index in TabIndex) {
                        setTabIndex(index as TabIndex);
                    }
                }
            }
        }
    }, [router.isReady, router.query.tab]);

    const handleTabChange = useCallback((_: SyntheticEvent | null, newIndex: number) => {
        setTabIndex(newIndex as TabIndex);

        const slug = TAB_SLUGS[newIndex as TabIndex];

        // Update URL with slug if available, otherwise index (though all should have slugs)
        const queryValue = slug || newIndex;

        // Update URL without reloading
        router.push({
            pathname: router.pathname,
            query: { ...router.query, tab: queryValue },
        }, undefined, { shallow: true });
    }, [router]);

    return { tabIndex, handleTabChange };
}

export function getTabSlug(index: TabIndex): string {
    return TAB_SLUGS[index] || String(index);
}
