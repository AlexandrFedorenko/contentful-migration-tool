import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";

interface Backup {
    name: string;
    path: string;
    time: number;
}

interface BackupsResponse {
    backups: Backup[];
}

export function useBackups() {
    const { dispatch } = useGlobalContext();
    const { withLoading } = useLoading();

    const loadBackups = useCallback(async (spaceId: string) => {
        if (!spaceId) {
            dispatch({ 
                type: "SET_STATUS", 
                payload: 'Space ID is required to load backups' 
            });
            return;
        }

        try {
            const backups = await withLoading("loadingBackups", async () => {
                const response = await fetch(`/api/backups?spaceId=${spaceId}`);
                if (!response.ok) {
                    throw new Error('Failed to load backups');
                }
                const data: BackupsResponse = await response.json();
                return data.backups;
            });

            dispatch({ 
                type: "SET_DATA", 
                payload: { backups } 
            });
        } catch (error) {
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Error loading backups: ${handleError(error)}` 
            });
        }
    }, [dispatch, withLoading]);

    return { loadBackups };
} 