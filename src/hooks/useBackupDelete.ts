import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";
import { Backup } from "@/types/backup";
import { api } from "@/utils/api";
import { useBackups } from "./useBackups";

interface DeleteBackupRequest {
    spaceId: string;
    backupId: string;
    fileName?: string; // Optional legacy
}

export function useBackupDelete() {
    const { dispatch } = useGlobalContext();
    const { withLoading } = useLoading();
    const { loadBackups } = useBackups();

    const handleDelete = useCallback(async (
        spaceId: string,
        backup: Backup
    ) => {
        try {
            if (!backup.id) {
                throw new Error("Backup ID is missing");
            }

            dispatch({
                type: "SET_STATUS",
                payload: `Deleting backup ${backup.name}...`
            });

            await withLoading("loadingDelete", async () => {
                const result = await api.post<void>('/api/deleteBackup', {
                    spaceId,
                    backupId: backup.id,
                    fileName: backup.name
                } as DeleteBackupRequest);

                if (!result.success) {
                    throw new Error(result.error || 'Failed to delete backup');
                }
            });

            await loadBackups(spaceId, true);

            dispatch({
                type: "SET_STATUS",
                payload: `Backup ${backup.name} deleted successfully`
            });
        } catch (error) {
            dispatch({
                type: "SET_STATUS",
                payload: `Error deleting backup: ${handleError(error)}`
            });
        }
    }, [dispatch, withLoading, loadBackups]);

    return { handleDelete };
}
