import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";

export function useBackups() {
  const { dispatch } = useGlobalContext();
  const { withLoading } = useLoading();

  const loadBackups = useCallback(async (spaceId: string) => {
    try {
      const backups = await withLoading("loadingBackups", async () => {
        const response = await fetch(`/api/backups?spaceId=${spaceId}`);
        if (!response.ok) {
          throw new Error('Failed to load backups');
        }
        const data = await response.json();
        return data.backups;
      });

      dispatch({ type: "SET_DATA", payload: { backups } });
    } catch (error) {
      console.error("❌ Error loading backups:", error);
      dispatch({ type: "SET_STATUS", payload: `Error loading backups: ${handleError(error)}` });
    }
  }, [dispatch, withLoading]);

  return { loadBackups };
} 