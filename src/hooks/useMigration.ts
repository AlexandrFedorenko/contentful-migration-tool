import { useCallback, useRef, useEffect } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { api } from "@/utils/api";
import { useBackups } from "./useBackups";
import { useLoading } from "./useLoading";

interface MigrationResponse {
    success: boolean;
    error?: string;
    sourceBackupFile?: string;
    targetBackupFile?: string;
}

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

export function useMigration() {
    const { state, dispatch } = useGlobalContext();
    const { loadBackups } = useBackups();
    const { setLoading } = useLoading();
    
    const stateRef = useRef(state);
    
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const handleMigration = useCallback(async () => {
        const { spaceId, selectedDonor, selectedTarget } = stateRef.current;

        try {
            validateEnvironments({ spaceId, selectedDonor, selectedTarget });

            dispatch({ 
                type: "SET_STATUS", 
                payload: `Starting migration from ${selectedDonor} to ${selectedTarget}...`
            });

            setLoading("loadingMigration", true);

            try {
                const response = await api.post<MigrationResponse>('/api/migrate', {
                    spaceId,
                    sourceEnvironment: selectedDonor,
                    targetEnvironment: selectedTarget
                });

                if (response.success) {
                    dispatch({ 
                        type: "SET_STATUS", 
                        payload: `Migration completed successfully! Created backups: ${response.data?.sourceBackupFile}, ${response.data?.targetBackupFile}`
                    });
                    
                    await loadBackups(spaceId);
                } else {
                    throw new Error(response.error || 'Failed to migrate content');
                }
            } finally {
                setLoading("loadingMigration", false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to migrate content';
            
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Migration failed: ${errorMessage}`
            });
        }
    }, [dispatch, loadBackups, setLoading]);

    return { handleMigration };
}
