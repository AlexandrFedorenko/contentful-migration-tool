import { useCallback, useEffect, useRef } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";
import { useRouter } from 'next/router';
import { useError } from "@/context/ErrorContext";

interface BackupsResponse {
    backups: Array<{
        name: string;
        path: string;
        time: number;
    }>;
}

export function useBackup() {
    const router = useRouter();
    const { state, dispatch } = useGlobalContext();
    const { withLoading } = useLoading();
    const { showError } = useError();
    const spaceIdRef = useRef(state.spaceId);

    useEffect(() => {
        spaceIdRef.current = state.spaceId;
    }, [state.spaceId]);

    useEffect(() => {
        const { id } = router.query;
        if (id && typeof id === 'string') {
            dispatch({ type: "SET_SPACE_ID", payload: id });
        }
    }, [router.query, dispatch]);

    const loadBackups = useCallback(async (spaceId: string) => {
        if (!spaceId) return;

        try {
            const response = await fetch(`/api/backups?spaceId=${spaceId}`);
            if (!response.ok) {
                throw new Error('Failed to load backups');
            }
            const data: BackupsResponse = await response.json();
            dispatch({
                type: "SET_DATA",
                payload: { backups: data.backups }
            });
        } catch (error) {
            const errorMessage = `Failed to load backups: ${handleError(error)}`;
            dispatch({
                type: "SET_STATUS",
                payload: errorMessage
            });
            showError(errorMessage);
        }
    }, [dispatch, showError]);

    useEffect(() => {
        if (state.spaceId) {
            loadBackups(state.spaceId);
        }
    }, [state.spaceId, loadBackups]);

    const handleBackup = useCallback(async () => {
        const spaceId = spaceIdRef.current;
        const selectedDonor = state.selectedDonor;

        if (!spaceId || !selectedDonor) {
            dispatch({
                type: "SET_STATUS",
                payload: 'Space ID and source environment are required'
            });
            return;
        }

        try {
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

            await loadBackups(spaceId);

            dispatch({
                type: "SET_STATUS",
                payload: `Backup of ${selectedDonor} environment completed successfully`
            });
        } catch (error) {
            const errorMessage = `Error creating backup: ${handleError(error)}`;
            dispatch({
                type: "SET_STATUS",
                payload: errorMessage
            });
            showError(errorMessage);
        }
    }, [state.selectedDonor, dispatch, withLoading, loadBackups, showError]);

    return { handleBackup };
}
