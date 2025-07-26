import { useCallback } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { api } from "@/utils/api";

export function useRestore() {
    const { state, dispatch } = useGlobalContext();

    const handleRestore = useCallback(async (backupFileName: string) => {
        const { spaceId, selectedTarget } = state;

        try {
            if (!spaceId || !backupFileName || !selectedTarget) {
                throw new Error('Space ID, backup file and target environment are required');
            }

            // Начинаем восстановление - показываем спиннер
            dispatch({
                type: "SET_RESTORE_PROGRESS",
                payload: {
                    isActive: true,
                    steps: [], // No longer tracking detailed steps here
                    currentStep: 1, // Just a simple indicator that it's active
                    overallProgress: 0,
                    restoringBackupName: backupFileName // Добавляем имя бэкапа
                }
            });

            // Выполняем восстановление
            const response = await api.post('/api/restore', {
                spaceId,
                fileName: backupFileName,
                targetEnvironment: selectedTarget
            });

            if (response.success) {
                // Завершаем успешно
                dispatch({
                    type: "SET_RESTORE_PROGRESS",
                    payload: {
                        isActive: false,
                        currentStep: 0,
                        overallProgress: 0,
                        restoringBackupName: undefined // Очищаем имя бэкапа
                    }
                });

                // Очищаем инструкции об ошибках при успешном восстановлении
                dispatch({ type: "CLEAR_ERROR_INSTRUCTION" });
                
                dispatch({ 
                    type: "SET_STATUS", 
                    payload: `Backup ${backupFileName} restored to ${selectedTarget} successfully` 
                });
            } else {
                throw new Error(response.error || 'Failed to restore backup');
            }
        } catch (error) {
            console.error("❌ Restore error:", error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to restore backup';
            
            // Завершаем с ошибкой
            dispatch({
                type: "SET_RESTORE_PROGRESS",
                payload: {
                    isActive: false,
                    currentStep: 0,
                    overallProgress: 0,
                    restoringBackupName: undefined // Очищаем имя бэкапа
                }
            });
            
            // Показываем лог в попапе
            dispatch({
                type: "SET_ERROR_INSTRUCTION",
                payload: { 
                    instruction: null, 
                    errorMessage, 
                    backupFile: backupFileName 
                }
            });
        }
    }, [state.spaceId, state.selectedTarget, dispatch]);

    return { handleRestore };
}
