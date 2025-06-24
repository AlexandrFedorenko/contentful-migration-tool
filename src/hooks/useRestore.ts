import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";

export function useRestore() {
    const { state, dispatch } = useGlobalContext();
    const { withLoading } = useLoading();

    const handleRestore = useCallback(async () => {
        try {
            const { spaceId, selectedBackup, selectedTarget } = state;

            if (!spaceId || !selectedBackup || !selectedTarget) {
                throw new Error('Space ID, backup file and target environment are required');
            }

            dispatch({ 
                type: "SET_STATUS", 
                payload: `Starting restore of ${selectedBackup} to ${selectedTarget} environment...` 
            });

            await withLoading("loadingRestore", async () => {
                const response = await fetch('/api/restore', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        spaceId,
                        fileName: selectedBackup,
                        targetEnvironment: selectedTarget
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to restore backup');
                }
            });

            dispatch({ 
                type: "SET_STATUS", 
                payload: `Backup ${selectedBackup} restored to ${selectedTarget} successfully` 
            });
        } catch (error) {
            console.error("❌ Restore error:", error);
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Error restoring backup: ${handleError(error)}` 
            });
        }
    }, [state.spaceId, state.selectedBackup, state.selectedTarget, dispatch, withLoading]);

    return { handleRestore };
}
