import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";

interface DeleteBackupRequest {
    spaceId: string;
    fileName: string;
    filePath: string;
}

interface DeleteBackupResponse {
    success: boolean;
    error?: string;
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

export function useBackupDelete() {
    const { dispatch } = useGlobalContext();
    const { withLoading } = useLoading();

    const handleDelete = useCallback(async (
        spaceId: string,
        fileName: string,
        filePath: string
    ) => {
        try {
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Deleting backup ${fileName}...` 
            });

            await withLoading("loadingDelete", async () => {
                const response = await fetch('/api/deleteBackup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        spaceId,
                        fileName,
                        filePath
                    } as DeleteBackupRequest)
                });

                if (!response.ok) {
                    const data: DeleteBackupResponse = await response.json();
                    throw new Error(data.error || 'Failed to delete backup');
                }
            });

            const backupsData = await loadBackups(spaceId);
            dispatch({ 
                type: "SET_DATA", 
                payload: { backups: backupsData.backups } 
            });

            dispatch({ 
                type: "SET_STATUS", 
                payload: `Backup ${fileName} deleted successfully` 
            });
        } catch (error) {
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Error deleting backup: ${handleError(error)}` 
            });
        }
    }, [dispatch, withLoading]);

    return { handleDelete };
} 