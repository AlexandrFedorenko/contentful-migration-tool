import { useCallback, useRef, useEffect } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useBackups } from "./useBackups";
import { useLoading } from "./useLoading";
import { useError } from "@/context/ErrorContext";

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
    const { showError } = useError();

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
            dispatch({ type: "CLEAR_LOGS" });

            setLoading("loadingMigration", true);

            try {
                const response = await fetch('/api/migrate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        spaceId,
                        sourceEnvironment: selectedDonor,
                        targetEnvironment: selectedTarget
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to migrate content');
                }

                if (!response.body) {
                    throw new Error('No response body received');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            try {
                                const event = JSON.parse(data);

                                if (event.type === 'log') {
                                    dispatch({ type: "ADD_LOG", payload: event.message });
                                } else if (event.type === 'error') {
                                    throw new Error(event.error);
                                } else if (event.type === 'complete') {
                                    dispatch({
                                        type: "SET_STATUS",
                                        payload: `Migration completed successfully! Created backups: ${event.data.sourceBackupFile}, ${event.data.targetBackupFile}`
                                    });
                                    await loadBackups(spaceId);
                                }
                            } catch (e) {
                                console.error('Failed to parse SSE event:', e);
                            }
                        }
                    }
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
            dispatch({ type: "ADD_LOG", payload: `Error: ${errorMessage}` });
            showError(errorMessage);
        }
    }, [dispatch, loadBackups, setLoading, showError]);

    return { handleMigration };
}
