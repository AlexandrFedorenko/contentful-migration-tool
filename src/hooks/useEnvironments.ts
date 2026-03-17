import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";
import { Environment } from "@/types/common";
import { api } from "@/utils/api";

interface EnvironmentsResponse {
    environments: Environment[];
}

export function useEnvironments() {
    const { state, dispatch } = useGlobalContext();
    const { withLoading } = useLoading();
    const { donorEnvironments, loading, errors } = state;
    const isLoading = loading.loadingEnvironments;

    const loadEnvironments = useCallback(async (spaceId: string, force = false) => {
        if (!spaceId) {
            dispatch({
                type: "SET_STATUS",
                payload: 'Space ID is required to load environments'
            });
            return;
        }

        // Deduplication: if we have environments, are already loading, or have a recent error for this space, return early
        if ((donorEnvironments.length > 0 || isLoading || (errors.environments[spaceId] && !force))) {
            return;
        }

        try {
            const environments = await withLoading("loadingEnvironments", async () => {
                const result = await api.get<EnvironmentsResponse>(`/api/environments?spaceId=${spaceId}`);
                if (!result.success || !result.data) {
                    throw new Error(result.error || 'Failed to load environments');
                }
                return result.data.environments;
            });

            dispatch({
                type: "SET_DATA",
                payload: {
                    donorEnvironments: environments,
                    targetEnvironments: environments,
                    errors: { 
                        ...errors, 
                        environments: { ...errors.environments, [spaceId]: null } 
                    }
                }
            });
        } catch (error) {
            const message = handleError(error);
            dispatch({
                type: "SET_DATA",
                payload: {
                    errors: { 
                        ...errors, 
                        environments: { ...errors.environments, [spaceId]: message } 
                    }
                }
            });
            dispatch({
                type: "SET_STATUS",
                payload: `Error loading environments: ${message}`
            });
        }
    }, [dispatch, withLoading, donorEnvironments.length, isLoading, errors]);

    return { loadEnvironments };
} 