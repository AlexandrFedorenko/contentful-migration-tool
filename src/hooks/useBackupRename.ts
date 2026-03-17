import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";
import { api } from "@/utils/api";
import { useBackups } from "./useBackups";

interface RenameBackupRequest {
    spaceId: string;
    oldFileName: string;
    newFileName: string;
}

export function useBackupRename() {
    const { dispatch } = useGlobalContext();
    const { withLoading } = useLoading();
    const { loadBackups } = useBackups();

    const handleRename = useCallback(async (
        spaceId: string,
        oldFileName: string,
        newFileName: string
    ) => {
        try {
            dispatch({
                type: "SET_STATUS",
                payload: `Renaming backup ${oldFileName}...`
            });

            await withLoading("loadingRename", async () => {
                const result = await api.post<void>('/api/renameBackup', {
                    spaceId,
                    oldFileName,
                    newFileName
                } as RenameBackupRequest);

                if (!result.success) {
                    throw new Error(result.error || 'Failed to rename backup');
                }
            });

            await loadBackups(spaceId, true);

            dispatch({
                type: "SET_STATUS",
                payload: `Backup renamed successfully`
            });

            return true;
        } catch (error) {
            dispatch({
                type: "SET_STATUS",
                payload: `Error renaming backup: ${handleError(error)}`
            });
            return false;
        }
    }, [dispatch, withLoading, loadBackups]);

    return { handleRename };
}
