import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";
import { Environment } from "@/types/common";

interface EnvironmentsResponse {
    environments: Environment[];
}

export function useEnvironments() {
    const { dispatch } = useGlobalContext();
    const { withLoading } = useLoading();

    const loadEnvironments = useCallback(async (spaceId: string) => {
        if (!spaceId) {
            dispatch({ 
                type: "SET_STATUS", 
                payload: 'Space ID is required to load environments' 
            });
            return;
        }

        try {
            const environments = await withLoading("loadingEnvironments", async () => {
                const response = await fetch(`/api/environments?spaceId=${spaceId}`);
                if (!response.ok) {
                    throw new Error('Failed to load environments');
                }
                const data: EnvironmentsResponse = await response.json();
                return data.environments;
            });

            dispatch({ 
                type: "SET_DATA", 
                payload: { 
                    donorEnvironments: environments,
                    targetEnvironments: environments
                } 
            });
        } catch (error) {
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Error loading environments: ${handleError(error)}` 
            });
        }
    }, [dispatch, withLoading]);

    return { loadEnvironments };
} 