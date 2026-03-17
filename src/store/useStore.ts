import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GlobalState, Action } from '@/types/state';

const initialState: GlobalState = {
    spaceId: '',

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
    userProfile: null,
    appSettings: null,
    loading: {
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
        loadingUserProfile: false,
        loadingAppSettings: false,
    },
    errors: {
        profile: null,
        environments: {} as Record<string, string | null>
    },
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
    logs: [],
    restoreResult: {
        open: false,
        success: false
    }
};

// Pure reducer function taken from GlobalContext
function reducer(state: GlobalState, action: Action): GlobalState {
    switch (action.type) {
        case "SET_SPACE_ID":
            return {
                ...state,
                spaceId: action.payload,
                donorEnvironments: [],
                targetEnvironments: [],
                backups: [],
                selectedDonor: '',
                selectedTarget: '',
                selectedBackup: ''
            };
        case "SET_SOURCE_ENV":
            return { ...state, selectedDonor: action.payload };
        case "SET_TARGET_ENV":
            return { ...state, selectedTarget: action.payload };
        case "SET_DATA":
            // Special handling for persistence: if spaceId changes, Zustand persist handles it if configured,
            // but here we just update state.
            return { ...state, ...action.payload };
        case "SET_STATUS":
            return { ...state, statusMessage: action.payload, alertOpen: !!action.payload };
        case "CLOSE_ALERT":
            return { ...state, alertOpen: false };
        case "SET_LOADING":
            return { ...state, loading: { ...state.loading, [action.payload.key]: action.payload.value } };

        case "SET_ENVIRONMENTS":
            return { ...state, donorEnvironments: action.payload.donorEnvironments, targetEnvironments: action.payload.targetEnvironments };
        case "SET_BACKUPS":
            return { ...state, backups: action.payload };
        case "SET_ERROR":
            return { ...state, errors: { ...state.errors, [action.payload.key]: action.payload.value } };
        case "SET_RESTORE_MODE":
            return { ...state, restoreMode: action.payload };
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
            return { ...state, errorModalOpen: action.payload };
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
            return { ...state, restoreProgress: { ...state.restoreProgress, steps: updatedSteps } };
        case "ADD_LOG":
            return { ...state, logs: [...state.logs, action.payload] };
        case "CLEAR_LOGS":
            return { ...state, logs: [] };
        case "SET_RESTORE_RESULT":
            return {
                ...state,
                restoreResult: {
                    open: true,
                    success: action.payload.success,
                    backupName: action.payload.backupName,
                    targetEnvironment: action.payload.targetEnvironment,
                    errorMessage: action.payload.errorMessage
                }
            };
        case "CLOSE_RESTORE_RESULT":
            return { ...state, restoreResult: { open: false, success: false } };
        case "SET_USER_PROFILE":
            return { ...state, userProfile: action.payload };
        case "SET_APP_SETTINGS":
            return { ...state, appSettings: action.payload };
        case "RESET_SESSION":
            return {
                ...initialState,
                // We keep appSettings as they are global-ish, but clear everything user-specific
                appSettings: state.appSettings
            };
        default:
            return state;
    }
}

interface Store extends GlobalState {
    dispatch: (action: Action) => void;
    reset: () => void;
}

export const useStore = create<Store>()(
    persist(
        (set) => ({
            ...initialState,
            dispatch: (action: Action) => set((state) => reducer(state, action)),
            reset: () => set(() => ({ ...initialState })),
        }),
        {
            name: 'contentful-migration-tool-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({ spaceId: state.spaceId } as unknown as Store), // only persist spaceId
        }
    )
);
