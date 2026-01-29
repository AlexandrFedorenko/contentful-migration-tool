import { useCallback, useRef } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { api } from "@/utils/api";
import { RestoreResponse } from "@/types/api";
import { parseError } from "@/utils/errorParser";
import { useError } from "@/contexts/ErrorContext";

interface UseRestoreReturn {
    handleRestore: (backupFileName: string) => Promise<void>;
}

export function useRestore(): UseRestoreReturn {
    const { state, dispatch } = useGlobalContext();
    const { showError } = useError();
    const stateRef = useRef(state);
    stateRef.current = state;

    const resetProgress = useCallback((dispatch: ReturnType<typeof useGlobalContext>['dispatch']) => {
        dispatch({
            type: "SET_RESTORE_PROGRESS",
            payload: {
                isActive: false,
                currentStep: 0,
                overallProgress: 0,
                restoringBackupName: undefined
            }
        });
    }, []);

    const handleRestore = useCallback(async (backupFileName: string) => {
        const { spaceId, selectedTarget } = stateRef.current;

        try {
            if (!spaceId || !backupFileName || !selectedTarget) {
                throw new Error('Space ID, backup file and target environment are required');
            }

            dispatch({
                type: "SET_RESTORE_PROGRESS",
                payload: {
                    isActive: true,
                    steps: [],
                    currentStep: 1,
                    overallProgress: 0,
                    restoringBackupName: backupFileName
                }
            });

            const response = await api.post<RestoreResponse>('/api/restore', {
                spaceId,
                fileName: backupFileName,
                targetEnvironment: selectedTarget
            });

            if (response.success) {
                resetProgress(dispatch);
                dispatch({ type: "CLEAR_ERROR_INSTRUCTION" });
                dispatch({
                    type: "SET_STATUS",
                    payload: `Backup ${backupFileName} restored to ${selectedTarget} successfully`
                });
            } else {
                throw new Error(response.error || 'Failed to restore backup');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to restore backup';
            const instruction = parseError(errorMessage);

            resetProgress(dispatch);

            if (instruction) {
                dispatch({
                    type: "SET_ERROR_INSTRUCTION",
                    payload: {
                        instruction,
                        errorMessage,
                        backupFile: backupFileName
                    }
                });
            } else {
                dispatch({
                    type: "SET_STATUS",
                    payload: `Restore failed: ${errorMessage}`
                });
                showError(errorMessage);
            }
        }
    }, [dispatch, resetProgress, showError]);

    return { handleRestore };
}
