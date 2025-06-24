import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";

export function useEnvironments() {
  const { dispatch } = useGlobalContext();
  const { withLoading } = useLoading();

  const loadEnvironments = useCallback(async (spaceId: string) => {
    try {
      const environments = await withLoading("loadingSpaces", async () => {
        const response = await fetch(`/api/environments?spaceId=${spaceId}`);
        if (!response.ok) {
          throw new Error('Failed to load environments');
        }
        const data = await response.json();
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
      console.error("❌ Error loading environments:", error);
      dispatch({ type: "SET_STATUS", payload: `Error loading environments: ${handleError(error)}` });
    }
  }, [dispatch, withLoading]);

  return { loadEnvironments };
} 