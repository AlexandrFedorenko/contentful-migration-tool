// src/hooks/useMigration.ts
import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext"; // ваш глобальный контекст
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";
import { getNotificationMessage } from "@/utils/notifications";

interface MigrationResponse {
    success: boolean;
    message?: string;
    diffSize?: number;
    statistics?: Record<string, number>;
}

export function useMigration() {
    const { state, dispatch } = useGlobalContext();
    const { withLoading } = useLoading();

    const handleMigration = useCallback(async () => {
        try {
            const { spaceId, selectedDonor, selectedTarget, useAdvanced } = state;

            if (!spaceId || !selectedDonor || !selectedTarget) {
                throw new Error('Space ID, donor and target environments are required');
            }

            dispatch({ 
                type: "SET_STATUS", 
                payload: getNotificationMessage('migration', 'start', { 
                    from: selectedDonor,
                    to: selectedTarget
                })
            });

            await withLoading("loadingMigrate", async () => {
                // Отправляем запрос на API
                const response = await fetch('/api/migrate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        spaceId,
                        sourceEnvironment: selectedDonor,
                        targetEnvironment: selectedTarget,
                        useAdvanced
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to migrate content');
                }
            });

            dispatch({ 
                type: "SET_STATUS", 
                payload: getNotificationMessage('migration', 'success', { 
                    from: selectedDonor,
                    to: selectedTarget
                })
            });

        } catch (error) {
            console.error("❌ Migration error:", error);
            dispatch({ 
                type: "SET_STATUS", 
                payload: getNotificationMessage('migration', 'error', { 
                    error: handleError(error) 
                })
            });
        }
    }, [state.spaceId, state.selectedDonor, state.selectedTarget, state.useAdvanced, dispatch, withLoading]);

    return { handleMigration };
}
