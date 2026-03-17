import { useCallback, useEffect, useRef } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "@/hooks/useLoading";
import { useRouter } from 'next/router';
import { useError } from "@/context/ErrorContext";
import React from "react";
import { api } from "@/utils/api";
import { parseError, instructionToString } from "@/utils/errorParser";

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
            const result = await api.get<BackupsResponse>(`/api/backups?spaceId=${spaceId}`);
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to load backups');
            }
            dispatch({
                type: "SET_DATA",
                payload: { backups: result.data.backups }
            });
        } catch (error) {
            const instruction = parseError(error instanceof Error ? error.message : 'Unknown error');
            const translatedError = instructionToString(instruction);
            const errorMessage = `Failed to load backups: ${translatedError}`;
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

    const handleBackup = useCallback(async (
        includeAssets: boolean = false,
        includeDrafts: boolean = true,
        includeArchived: boolean = true,
        overWrite: boolean = false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<{ success: boolean; limitReached?: boolean; data?: any }> => {
        const spaceId = spaceIdRef.current;
        const selectedDonor = state.selectedDonor;

        if (!spaceId || !selectedDonor) {
            dispatch({
                type: "SET_STATUS",
                payload: 'Space ID and source environment are required'
            });
            return { success: false };
        }

        try {
            dispatch({
                type: "SET_STATUS",
                payload: `Starting backup of ${selectedDonor} environment${includeAssets ? ' (with assets)' : ''}...`
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let response: any = null;

            await withLoading("loadingBackup", async () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                response = await api.post<any>('/api/backup', {
                    spaceId,
                    env: selectedDonor,
                    includeAssets,
                    includeDrafts,
                    includeArchived,
                    overwrite: overWrite
                });
            });

            // Check for 409 backup limit reached (now inside withLoading to capture response)
            if (response && !response.success && response.data?.limitReached) {
                return { success: false, limitReached: true };
            }

            if (!response || !response.success || (!response.data && !response.limitReached)) {
                // Fallback for error handling
                throw new Error(response?.error || 'Failed to create backup');
            }

            const data = response.data;
            let backupData = data; // Declared backupData here

            if (data && data.hasZip && data.backupFile) {
                const downloadUrl = `/api/download-transient-zip?spaceId=${spaceId}&fileName=${encodeURIComponent(data.backupFile)}`;

                dispatch({
                    type: "SET_STATUS",
                    payload: (
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>Backup completed. Assets download should start automatically.</span>
                            <span>
                                If not, <a href={downloadUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 'bold' }}>
                                    CLICK HERE TO DOWNLOAD ASSETS ZIP
                                </a>
                            </span>
                        </span>
                    )
                });

                // Trigger download in new tab
                window.open(downloadUrl, '_blank');

                // Delay before list reload to ensure download handshake
                await new Promise(r => setTimeout(r, 2500));
            }

            if (backupData) {
                await loadBackups(spaceId);

                // Re-dispatch success status if it wasn't overwritten by the asset download message
                if (!includeAssets) {
                    dispatch({
                        type: "SET_STATUS",
                        payload: `Backup of ${selectedDonor} environment completed successfully`
                    });
                }

                return { success: true, data: backupData };
            }

            return { success: false };

        } catch (error) {
            const instruction = parseError(error instanceof Error ? error.message : 'Unknown error');
            const translatedError = instructionToString(instruction);
            const errorMessage = `Error creating backup: ${translatedError}`;
            dispatch({
                type: "SET_STATUS",
                payload: errorMessage
            });
            showError(errorMessage);
            return { success: false };
        }
    }, [state.selectedDonor, dispatch, withLoading, loadBackups, showError]);

    return { handleBackup };
}

