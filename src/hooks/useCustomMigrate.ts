import { useCallback, useRef, useEffect } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { useBackups } from "./useBackups";
import { api } from "@/utils/api";
import { AnalyzeContentTypesResponse, CustomMigrateResponse } from "@/types/api";

interface EnvironmentValidation {
    spaceId: string;
    selectedDonor: string;
    selectedTarget: string;
}

const validateEnvironments = ({ spaceId, selectedDonor, selectedTarget }: EnvironmentValidation): void => {
    if (!spaceId || !selectedDonor || !selectedTarget) {
        throw new Error('Space ID, source and target environments are required');
    }

    if (selectedDonor === selectedTarget) {
        throw new Error('Source and target environments must be different');
    }
};

export function useCustomMigrate() {
    const { state, dispatch } = useGlobalContext();
    const { setLoading } = useLoading();
    const { loadBackups } = useBackups();

    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const analyzeContentTypes = useCallback(async () => {
        const { spaceId, selectedDonor, selectedTarget } = stateRef.current;

        try {
            validateEnvironments({ spaceId, selectedDonor, selectedTarget });

            dispatch({
                type: "SET_STATUS",
                payload: `Analyzing content types between ${selectedDonor} and ${selectedTarget}...`
            });

            setLoading("loadingAnalyze", true);

            try {
                const response = await api.post<AnalyzeContentTypesResponse>('/api/analyze-content-types', {
                    spaceId,
                    sourceEnvironment: selectedDonor,
                    targetEnvironment: selectedTarget
                });

                if (response.success && response.data?.contentTypes) {
                    return response.data.contentTypes;
                } else {
                    throw new Error(response.error || 'Failed to analyze content types');
                }
            } finally {
                setLoading("loadingAnalyze", false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to analyze content types';

            dispatch({
                type: "SET_STATUS",
                payload: `Analysis failed: ${errorMessage}`
            });

            throw error;
        }
    }, [dispatch, setLoading]);

    const previewCustomMigrate = useCallback(async (selectedContentTypes: string[]) => {
        const { spaceId, selectedDonor, selectedTarget } = stateRef.current;

        try {
            validateEnvironments({ spaceId, selectedDonor, selectedTarget });

            if (selectedContentTypes.length === 0) {
                throw new Error('Please select at least one content type to migrate');
            }

            dispatch({
                type: "SET_STATUS",
                payload: `Generating preview for ${selectedContentTypes.length} content types...`
            });

            setLoading("loadingCustomMigrate", true);

            try {
                const response = await api.post<CustomMigrateResponse>('/api/custom-migrate', {
                    spaceId,
                    sourceEnvironment: selectedDonor,
                    targetEnvironment: selectedTarget,
                    selectedContentTypes,
                    action: 'preview'
                });

                if (response.success && response.data?.previewData) {
                    dispatch({
                        type: "SET_STATUS",
                        payload: `Preview generated successfully!`
                    });
                    return response.data.previewData;
                } else {
                    throw new Error(response.error || 'Failed to generate preview');
                }
            } finally {
                setLoading("loadingCustomMigrate", false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate preview';

            dispatch({
                type: "SET_STATUS",
                payload: `Preview generation failed: ${errorMessage}`
            });

            throw error;
        }
    }, [dispatch, setLoading]);

    const executeCustomMigrate = useCallback(async (selectiveBackupFile: string) => {
        const { spaceId, selectedDonor, selectedTarget } = stateRef.current;

        try {
            validateEnvironments({ spaceId, selectedDonor, selectedTarget });

            dispatch({
                type: "SET_STATUS",
                payload: `Executing migration from preview...`
            });

            setLoading("loadingCustomMigrate", true);

            try {
                const response = await api.post<CustomMigrateResponse>('/api/custom-migrate', {
                    spaceId,
                    sourceEnvironment: selectedDonor,
                    targetEnvironment: selectedTarget,
                    selectedContentTypes: [], // Not needed for execute
                    action: 'execute',
                    selectiveBackupFile
                });

                if (response.success) {
                    dispatch({
                        type: "SET_STATUS",
                        payload: `Custom migration completed successfully! Target backup: ${response.data?.targetBackupFile}`
                    });
                    await loadBackups(spaceId);
                } else {
                    throw new Error(response.error || 'Failed to execute migration');
                }
            } finally {
                setLoading("loadingCustomMigrate", false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to execute migration';

            dispatch({
                type: "SET_STATUS",
                payload: `Migration execution failed: ${errorMessage}`
            });

            throw error;
        }
    }, [dispatch, setLoading, loadBackups]);

    return { analyzeContentTypes, previewCustomMigrate, executeCustomMigrate };
}