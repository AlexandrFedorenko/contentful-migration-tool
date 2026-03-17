import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";
import { Backup } from "@/types/backup";
import { api } from "@/utils/api";

interface BackupsResponse {
    backups: Backup[];
}

export function useBackups() {
    const { state, dispatch } = useGlobalContext();
    const { withLoading } = useLoading();
    const { backups, loading } = state;
    const isLoading = loading.loadingBackups;

    const loadBackups = useCallback(async (spaceId: string, force = false) => {
        if (!spaceId) {
            dispatch({
                type: "SET_STATUS",
                payload: 'Space ID is required to load backups'
            });
            return;
        }

        if ((backups.length > 0 || isLoading) && !force) {
            return;
        }

        try {
            const backupsData = await withLoading("loadingBackups", async () => {
                const result = await api.get<BackupsResponse>(`/api/backups?spaceId=${spaceId}`);
                if (!result.success || !result.data) {
                    throw new Error(result.error || 'Failed to load backups');
                }
                return result.data.backups;
            });

            dispatch({
                type: "SET_DATA",
                payload: { backups: backupsData }
            });
        } catch (error) {
            dispatch({
                type: "SET_STATUS",
                payload: `Error loading backups: ${handleError(error)}`
            });
        }
    }, [dispatch, withLoading, backups.length, isLoading]);

    return { loadBackups };
} 