import { useCallback, useEffect } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { contentfulService } from "@/utils/contentful";
import { handleError } from "@/utils/errorHandler";
import { Backup } from "@/types/backup";
import { getNotificationMessage } from "@/utils/notifications";
import { useRouter } from 'next/router';

export function useBackup() {
    const router = useRouter();
    const { state, dispatch } = useGlobalContext();
    const { withLoading } = useLoading();

    // Устанавливаем spaceId из URL
    useEffect(() => {
        const { id } = router.query;
        if (id && typeof id === 'string') {
            dispatch({ type: "SET_SPACE_ID", payload: id });
        }
    }, [router.query, dispatch]);

    // Загружаем бэкапы при изменении spaceId
    useEffect(() => {
        const loadBackups = async () => {
            if (!state.spaceId) return;

            try {
                const backups = await contentfulService.getBackups(state.spaceId);
                dispatch({
                    type: "SET_DATA",
                    payload: { backups }
                });
            } catch (error) {
                console.error("Failed to load backups:", error);
            }
        };

        loadBackups();
    }, [state.spaceId, dispatch]);

    const handleBackup = useCallback(async () => {
        try {
            const { spaceId, selectedDonor } = state;
            
            if (!spaceId || !selectedDonor) {
                throw new Error('Space ID and source environment are required');
            }

            dispatch({ 
                type: "SET_STATUS", 
                payload: `Starting backup of ${selectedDonor} environment...` 
            });

            await withLoading("loadingBackup", async () => {
                const response = await fetch('/api/backup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        spaceId,
                        env: selectedDonor
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to create backup');
                }
            });

            // Обновляем список бэкапов
            const backupsResponse = await fetch(`/api/backups?spaceId=${spaceId}`);
            const backupsData = await backupsResponse.json();
            dispatch({ type: "SET_DATA", payload: { backups: backupsData.backups } });

            dispatch({ 
                type: "SET_STATUS", 
                payload: `Backup of ${selectedDonor} environment completed successfully` 
            });
        } catch (error) {
            console.error("❌ Backup error:", error);
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Error creating backup: ${handleError(error)}` 
            });
        }
    }, [state.spaceId, state.selectedDonor, dispatch, withLoading]);

    return { handleBackup };
}
