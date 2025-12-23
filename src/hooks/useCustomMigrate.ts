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

    const customMigrate = useCallback(async (selectedContentTypes: string[]) => {
        const { spaceId, selectedDonor, selectedTarget } = stateRef.current;

        try {
            validateEnvironments({ spaceId, selectedDonor, selectedTarget });

            if (selectedContentTypes.length === 0) {
                throw new Error('Please select at least one content type to migrate');
            }

            dispatch({ 
                type: "SET_STATUS", 
                payload: `Starting custom migration of ${selectedContentTypes.length} content types...`
            });

            setLoading("loadingCustomMigrate", true);

            try {
                const response = await api.post<CustomMigrateResponse>('/api/custom-migrate', {
                    spaceId,
                    sourceEnvironment: selectedDonor,
                    targetEnvironment: selectedTarget,
                    selectedContentTypes
                });

                if (response.success) {
                    dispatch({ 
                        type: "SET_STATUS", 
                        payload: `Custom migration completed successfully! Created backups: ${response.data?.sourceBackupFile}, ${response.data?.targetBackupFile}`
                    });
                    await loadBackups(spaceId);
                } else {
                    throw new Error(response.error || 'Failed to perform custom migration');
                }
            } finally {
                setLoading("loadingCustomMigrate", false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to perform custom migration';
            
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Custom migration failed: ${errorMessage}`
            });
            
            throw error;
        }
    }, [dispatch, setLoading, loadBackups]);

    return { analyzeContentTypes, customMigrate };
} 