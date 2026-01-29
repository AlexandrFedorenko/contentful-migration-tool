import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { Environment, LoadingState } from '@/types/common';
import { Backup } from '@/types/backup';
import { RestoreStep } from '@/components/RestoreProgressModal/types';
import { ErrorInstruction } from '@/utils/errorParser';

export interface Space {
    id: string;
    name: string;
}

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
    errorSpaces: string | null;
    loading: LoadingState;
    errors: {
        [key: string]: string | null;
    };
    restoreMode: boolean;
    errorInstruction: ErrorInstruction | null;
    errorModalOpen: boolean;
    lastErrorMessage: string | null;
    errorBackupFile: string | null;
    errorInstructions: ErrorInstruction[];
    restoreProgress: {
        isActive: boolean;
        steps: RestoreStep[];
        currentStep: number;
        overallProgress: number;
        restoringBackupName?: string;
    };
    logs: string[];
}

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
    errorSpaces: null,
    loading: {
        loadingSpaces: false,
        loadingEnvironments: false,
        loadingBackups: false,
        loadingBackup: false,
        loadingRestore: false,
        loadingMigration: false,
        loadingDelete: false,
        loadingAuth: false,
        loadingAnalyze: false,
        loadingCustomMigrate: false,
        loadingCustomRestore: false,
        loadingRename: false,
    },
    errors: {},
    restoreMode: false,
    errorInstruction: null,
    errorModalOpen: false,
    lastErrorMessage: null,
    errorBackupFile: null,
    errorInstructions: [],
    restoreProgress: {
        isActive: false,
        steps: [],
        currentStep: 0,
        overallProgress: 0
    },
    logs: []
};

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
    | { type: "SET_ERROR_INSTRUCTION"; payload: { instruction: ErrorInstruction; errorMessage: string; backupFile?: string } }
    | { type: "SET_ERROR_INSTRUCTIONS"; payload: { instructions: ErrorInstruction[]; errorMessage: string; backupFile?: string } }
    | { type: "CLEAR_ERROR_INSTRUCTION" }
    | { type: "TOGGLE_ERROR_MODAL"; payload: boolean }
    | { type: "SET_RESTORE_PROGRESS"; payload: { isActive: boolean; steps?: RestoreStep[]; currentStep?: number; overallProgress?: number; restoringBackupName?: string } }
    | { type: "UPDATE_RESTORE_STEP"; payload: { stepIndex: number; status: RestoreStep['status']; message?: string; duration?: string } }
    | { type: "ADD_LOG"; payload: string }
    | { type: "CLEAR_LOGS" };

function reducer(state: GlobalState, action: Action): GlobalState {
    switch (action.type) {
        case "SET_SPACE_ID":
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
                loading: {
                    ...state.loading,
                    loadingSpaces: action.payload
                }
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
        case "ADD_LOG":
            return {
                ...state,
                logs: [...state.logs, action.payload]
            };
        case "CLEAR_LOGS":
            return {
                ...state,
                logs: []
            };
        default:
            return state;
    }
}

interface GlobalContextType {
    state: GlobalState;
    dispatch: React.Dispatch<Action>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
    children: ReactNode;
}

export const GlobalProvider = React.memo<GlobalProviderProps>(({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Load spaceId from localStorage on mount
    React.useEffect(() => {
        const savedSpaceId = localStorage.getItem('selectedSpaceId');
        if (savedSpaceId && !state.spaceId) {
            dispatch({ type: "SET_DATA", payload: { spaceId: savedSpaceId } });
        }
    }, []);

    // Save spaceId to localStorage when it changes
    React.useEffect(() => {
        if (state.spaceId) {
            localStorage.setItem('selectedSpaceId', state.spaceId);
        }
    }, [state.spaceId]);

    const contextValue = useMemo(
        () => ({ state, dispatch }),
        [state, dispatch]
    );

    return (
        <GlobalContext.Provider value={contextValue}>
            {children}
        </GlobalContext.Provider>
    );
});

GlobalProvider.displayName = 'GlobalProvider';

export function useGlobalContext(): GlobalContextType {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobalContext must be used within a GlobalProvider');
    }
    return context;
}
