import { useState, useCallback, SyntheticEvent } from "react";

export enum TabIndex {
    CONTENTFUL = 0,
    CLI_INSTALLATION,
    HOW_IT_WORKS,
    ERRORS_SOLUTIONS,
    PRODUCTION_TRANSFER,
}

interface UseDocumentationTabsReturn {
    tabIndex: TabIndex;
    handleTabChange: (event: SyntheticEvent, newIndex: number) => void;
}

export function useDocumentationTabs(defaultIndex: TabIndex): UseDocumentationTabsReturn {
    const [tabIndex, setTabIndex] = useState<TabIndex>(defaultIndex);

    const handleTabChange = useCallback((_: SyntheticEvent, newIndex: number) => {
        if (newIndex >= TabIndex.CONTENTFUL && newIndex <= TabIndex.PRODUCTION_TRANSFER) {
            setTabIndex(newIndex as TabIndex);
        }
    }, []);

    return { tabIndex, handleTabChange };
}
