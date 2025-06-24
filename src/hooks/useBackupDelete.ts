import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";

export function useBackupDelete() {
  const { dispatch } = useGlobalContext();
  const { withLoading } = useLoading();

  const handleDelete = useCallback(async (spaceId: string, fileName: string, filePath: string) => {
    try {
      dispatch({ 
        type: "SET_STATUS", 
        payload: `Deleting backup ${fileName}...` 
      });

      await withLoading("loadingDelete", async () => {
        const response = await fetch('/api/deleteBackup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spaceId,
            fileName,
            filePath
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete backup');
        }
      });

      // Обновляем список бэкапов
      const backupsResponse = await fetch(`/api/backups?spaceId=${spaceId}`);
      const backupsData = await backupsResponse.json();
      dispatch({ type: "SET_DATA", payload: { backups: backupsData.backups } });

      dispatch({ 
        type: "SET_STATUS", 
        payload: `Backup ${fileName} deleted successfully` 
      });
    } catch (error) {
      console.error("❌ Delete error:", error);
      dispatch({ 
        type: "SET_STATUS", 
        payload: `Error deleting backup: ${handleError(error)}` 
      });
    }
  }, [dispatch, withLoading]);

  return { handleDelete };
} 