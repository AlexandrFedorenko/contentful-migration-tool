import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Environment, LoadingState } from '@/types/common';
import { Backup } from '@/types/backup';
import { RestoreStep } from '@/components/RestoreProgressModal';

// 1) Определяем интерфейсы
export interface Space {
    id: string;
    name: string;
}

// 2) Список полей в глобальном стейте
export interface GlobalState {
    spaceId: string;
    spaces: Space[];
    donorEnvironments: Environment[];
    targetEnvironments: Environment[];
    backups: Backup[];
    selectedDonor: string;
    selectedTarget: string;
    selectedBackup: string;
    selectedRestoreTarget: string;
    selectedBackupEnv: string;
    useAdvanced: boolean;
    statusMessage: string | null;
    alertOpen: boolean;
    loadingBackup: boolean;
    loadingRestore: boolean;
    loadingMigration: boolean;
    loadingSpaces: boolean;
    errorSpaces: string | null;
    loading: {
        loadingSpaces: boolean;
        loadingBackups: boolean;
        loadingBackup: boolean;
        loadingRestore: boolean;
        loadingDelete: boolean;
        loadingMigrate: boolean;
        loadingAuth: boolean;
    };
    errors: {
        [key: string]: string | null;
    };
    restoreMode: boolean;
    // Новые поля для управления ошибками
    errorInstruction: any | null;
    errorModalOpen: boolean;
    lastErrorMessage: string | null;
    errorBackupFile: string | null; // Файл бэкапа, который вызвал ошибку
    errorInstructions: any[]; // Массив всех ошибок для детального отображения
    // Поля для прогресса восстановления
    restoreProgress: {
      isActive: boolean;
      steps: RestoreStep[];
      currentStep: number;
      overallProgress: number;
      restoringBackupName?: string; // Имя бэкапа, который сейчас восстанавливается
    };
}

// 3) Начальное значение
const initialState: GlobalState = {
    spaceId: '',
    spaces: [],
    donorEnvironments: [],
    targetEnvironments: [],
    backups: [],
    selectedDonor: '',
    selectedTarget: '',
    selectedBackup: '',
    selectedRestoreTarget: '',
    selectedBackupEnv: '',
    useAdvanced: false,
    statusMessage: null,
    alertOpen: false,
    loadingBackup: false,
    loadingRestore: false,
    loadingMigration: false,
    loadingSpaces: false,
    errorSpaces: null,
    loading: {
        loadingSpaces: false,
        loadingBackups: false,
        loadingBackup: false,
        loadingRestore: false,
        loadingDelete: false,
        loadingMigrate: false,
        loadingAuth: false,
    },
    errors: {},
    restoreMode: false,
    // Новые поля для управления ошибками
    errorInstruction: null,
    errorModalOpen: false,
    lastErrorMessage: null,
    errorBackupFile: null,
    errorInstructions: [],
    // Поля для прогресса восстановления
    restoreProgress: {
      isActive: false,
      steps: [],
      currentStep: 0,
      overallProgress: 0
    }
};

// 4) Описание Action
type Action = 
    | { type: "SET_SPACE_ID"; payload: string }
    | { type: "SET_SOURCE_ENV"; payload: string }
    | { type: "SET_TARGET_ENV"; payload: string }
    | { type: "SET_DATA"; payload: Partial<GlobalState> }
    | { type: "SET_STATUS"; payload: string | null }
    | { type: "CLOSE_ALERT" }
    | { type: "SET_LOADING"; payload: { key: string; value: boolean } }
    | { type: "SET_SPACES_LOADING"; payload: boolean }
    | { type: "SET_SPACES_ERROR"; payload: string | null }
    | { type: "SET_SPACES"; payload: Space[] }
    | { type: "SET_ENVIRONMENTS"; payload: { donorEnvironments: Environment[]; targetEnvironments: Environment[] } }
    | { type: "SET_BACKUPS"; payload: Backup[] }
    | { type: "SET_ERROR"; payload: { key: string; value: string | null } }
    | { type: "SET_RESTORE_MODE"; payload: boolean }
    | { type: "SET_ERROR_INSTRUCTION"; payload: { instruction: any; errorMessage: string; backupFile?: string } }
    | { type: "SET_ERROR_INSTRUCTIONS"; payload: { instructions: any[]; errorMessage: string; backupFile?: string } }
    | { type: "CLEAR_ERROR_INSTRUCTION" }
    | { type: "TOGGLE_ERROR_MODAL"; payload: boolean }
    | { type: "SET_RESTORE_PROGRESS"; payload: { isActive: boolean; steps?: RestoreStep[]; currentStep?: number; overallProgress?: number; restoringBackupName?: string } }
    | { type: "UPDATE_RESTORE_STEP"; payload: { stepIndex: number; status: RestoreStep['status']; message?: string; duration?: string } };

// 5) Сам reducer
function reducer(state: GlobalState, action: Action): GlobalState {
    switch (action.type) {
        case "SET_SPACE_ID":
            console.log('Setting spaceId:', action.payload);
            return {
                ...state,
                spaceId: action.payload
            };
        case "SET_SOURCE_ENV":
            return {
                ...state,
                selectedDonor: action.payload
            };
        case "SET_TARGET_ENV":
            return {
                ...state,
                selectedTarget: action.payload
            };
        case "SET_DATA":
            return {
                ...state,
                ...action.payload
            };
        case "SET_STATUS":
            return {
                ...state,
                statusMessage: action.payload,
                alertOpen: !!action.payload
            };
        case "CLOSE_ALERT":
            return {
                ...state,
                alertOpen: false
            };
        case "SET_LOADING":
            return {
                ...state,
                loading: {
                    ...state.loading,
                    [action.payload.key]: action.payload.value
                }
            };
        case "SET_SPACES_LOADING":
            return {
                ...state,
                loadingSpaces: action.payload
            };
        case "SET_SPACES_ERROR":
            return {
                ...state,
                errorSpaces: action.payload
            };
        case "SET_SPACES":
            return {
                ...state,
                spaces: action.payload
            };
        case "SET_ENVIRONMENTS":
            return {
                ...state,
                donorEnvironments: action.payload.donorEnvironments,
                targetEnvironments: action.payload.targetEnvironments
            };
        case "SET_BACKUPS":
            return {
                ...state,
                backups: action.payload
            };
        case "SET_ERROR":
            return {
                ...state,
                errors: { ...state.errors, [action.payload.key]: action.payload.value }
            };
        case "SET_RESTORE_MODE":
            return {
                ...state,
                restoreMode: action.payload
            };
        case "SET_ERROR_INSTRUCTION":
            return {
                ...state,
                errorInstruction: action.payload.instruction,
                lastErrorMessage: action.payload.errorMessage,
                errorBackupFile: action.payload.backupFile || null,
                errorModalOpen: true
            };
        case "SET_ERROR_INSTRUCTIONS":
            return {
                ...state,
                errorInstructions: action.payload.instructions,
                lastErrorMessage: action.payload.errorMessage,
                errorBackupFile: action.payload.backupFile || null,
                errorModalOpen: true
            };
        case "CLEAR_ERROR_INSTRUCTION":
            return {
                ...state,
                errorInstruction: null,
                errorInstructions: [],
                lastErrorMessage: null,
                errorBackupFile: null,
                errorModalOpen: false
            };
        case "TOGGLE_ERROR_MODAL":
            return {
                ...state,
                errorModalOpen: action.payload
            };
        case "SET_RESTORE_PROGRESS":
            return {
                ...state,
                restoreProgress: {
                    ...state.restoreProgress,
                    isActive: action.payload.isActive,
                    steps: action.payload.steps || state.restoreProgress.steps,
                    currentStep: action.payload.currentStep ?? state.restoreProgress.currentStep,
                    overallProgress: action.payload.overallProgress ?? state.restoreProgress.overallProgress,
                    restoringBackupName: action.payload.restoringBackupName || state.restoreProgress.restoringBackupName
                }
            };
        case "UPDATE_RESTORE_STEP":
            const updatedSteps = [...state.restoreProgress.steps];
            if (updatedSteps[action.payload.stepIndex]) {
                updatedSteps[action.payload.stepIndex] = {
                    ...updatedSteps[action.payload.stepIndex],
                    status: action.payload.status,
                    message: action.payload.message,
                    duration: action.payload.duration
                };
            }
            return {
                ...state,
                restoreProgress: {
                    ...state.restoreProgress,
                    steps: updatedSteps
                }
            };
        default:
            return state;
    }
}

// 6) Создаём контекст
const GlobalContext = createContext<{
    state: GlobalState;
    dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

// 7) Провайдер, обёртывающий всё приложение
export function GlobalProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <GlobalContext.Provider value={{ state, dispatch }}>
            {children}
        </GlobalContext.Provider>
    );
}

// 8) Хук для доступа к контексту
export function useGlobalContext() {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobalContext must be used within a GlobalProvider');
    }
    return context;
}
