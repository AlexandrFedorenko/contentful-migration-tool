// src/hooks/useMigration.ts
import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { api } from "@/utils/api";
import { useBackups } from "./useBackups";
import { useLoading } from "./useLoading";

interface MigrationResponse {
    success: boolean;
    error?: string;
    sourceBackupFile?: string;
    targetBackupFile?: string;
}

export function useMigration() {
    const { state, dispatch } = useGlobalContext();
    const { loadBackups } = useBackups();
    const { setLoading } = useLoading();

    const handleMigration = useCallback(async () => {
        try {
            const { spaceId, selectedDonor, selectedTarget } = state;

            if (!spaceId || !selectedDonor || !selectedTarget) {
                throw new Error('Space ID, source and target environments are required');
            }

            if (selectedDonor === selectedTarget) {
                throw new Error('Source and target environments must be different');
            }

            dispatch({ 
                type: "SET_STATUS", 
                payload: `Starting migration from ${selectedDonor} to ${selectedTarget}...`
            });

            // Устанавливаем состояние загрузки
            setLoading("loadingMigrate", true);

            try {
                // Отправляем запрос на API
                const response = await api.post<MigrationResponse>('/api/migrate', {
                    spaceId,
                    sourceEnvironment: selectedDonor,
                    targetEnvironment: selectedTarget
                });

                if (response.success) {
                    dispatch({ 
                        type: "SET_STATUS", 
                        payload: `Migration completed successfully! Created backups: ${response.data?.sourceBackupFile}, ${response.data?.targetBackupFile}`
                    });
                    
                    // Обновляем список бэкапов
                    await loadBackups(spaceId);
                } else {
                    throw new Error(response.error || 'Failed to migrate content');
                }
            } finally {
                // Сбрасываем состояние загрузки
                setLoading("loadingMigrate", false);
            }

        } catch (error) {
            console.error("❌ Migration error:", error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to migrate content';
            
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Migration failed: ${errorMessage}`
            });
        }
    }, [state.spaceId, state.selectedDonor, state.selectedTarget, dispatch, loadBackups, setLoading]);

    return { handleMigration };
}
