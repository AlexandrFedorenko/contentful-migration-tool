import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";

interface RenameBackupRequest {
    spaceId: string;
    oldFileName: string;
    newFileName: string;
}

interface BackupsResponse {
    backups: Array<{
        name: string;
        path: string;
        time: number;
    }>;
}

const loadBackups = async (spaceId: string): Promise<BackupsResponse> => {
    const response = await fetch(`/api/backups?spaceId=${spaceId}`);
    if (!response.ok) {
        throw new Error('Failed to load backups');
    }
    return response.json();
};

export function useBackupRename() {
    const { dispatch } = useGlobalContext();
    const { withLoading } = useLoading();

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
                const response = await fetch('/api/renameBackup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        spaceId,
                        oldFileName,
                        newFileName
                    } as RenameBackupRequest)
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to rename backup');
                }
            });

            const backupsData = await loadBackups(spaceId);
            dispatch({
                type: "SET_DATA",
                payload: { backups: backupsData.backups }
            });

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
    }, [dispatch, withLoading]);

    return { handleRename };
}
