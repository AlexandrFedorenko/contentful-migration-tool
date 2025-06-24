import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";
import { getNotificationMessage } from "@/utils/notifications";
import { Backup } from "@/types/backup";

export function useDeleteBackup() {
    const { state, dispatch } = useGlobalContext();
    const { withLoading } = useLoading();

    const handleDelete = useCallback(async (backup: Backup) => {
        try {
            console.log('🗑️ Attempting to delete backup:', backup);

            dispatch({ 
                type: "SET_STATUS", 
                payload: getNotificationMessage('deleteBackup', 'start', { 
                    file: backup.name 
                })
            });

            await withLoading("loadingBackup", async () => {
                const response = await fetch('/api/deleteBackup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        spaceId: state.spaceId,
                        fileName: backup.name,
                        filePath: backup.path
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to delete backup');
                }
            });

            dispatch({
                type: "SET_DATA",
                payload: {
                    backups: state.backups.filter(b => b.name !== backup.name),
                },
            });

            dispatch({ 
                type: "SET_STATUS", 
                payload: getNotificationMessage('deleteBackup', 'success', {
                    file: backup.name
                })
            });

        } catch (error) {
            console.error("❌ Delete backup error:", error);
            dispatch({ 
                type: "SET_STATUS", 
                payload: getNotificationMessage('deleteBackup', 'error', { 
                    error: handleError(error) 
                })
            });
        }
    }, [state.backups, state.spaceId, dispatch, withLoading]);

    return { handleDelete };
}
