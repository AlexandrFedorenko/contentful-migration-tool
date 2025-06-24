import { useState, useCallback } from "react";

// Определяем тип и Enum вкладок. Можно экспортировать, чтобы переиспользовать в другом месте
export enum TabIndex {
    CONTENTFUL = 0,
    CLI_INSTALLATION,
    HOW_IT_WORKS,
    ERRORS_SOLUTIONS,
    PRODUCTION_TRANSFER,
}

// Кастомный хук, который управляет состоянием вкладок
export function useDocumentationTabs(defaultIndex: TabIndex) {
    const [tabIndex, setTabIndex] = useState<TabIndex>(defaultIndex);

    // Обработчик смены вкладок
    const handleTabChange = useCallback((_: React.SyntheticEvent, newIndex: number) => {
        setTabIndex(newIndex as TabIndex);
    }, []);

    return { tabIndex, handleTabChange };
}
