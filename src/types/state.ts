import { ReactNode } from 'react';
import { Environment } from '@/types/common';
import { Backup } from '@/types/backup';
import { RestoreStep } from '@/components/RestoreProgressModal/types';
import { ErrorInstruction } from '@/utils/errorParser';

export interface LoadingState {
    loadingEnvironments: boolean;
    loadingBackups: boolean;
    loadingBackup: boolean;
    loadingRestore: boolean;
    loadingMigration: boolean;
    loadingDelete: boolean;
    loadingAuth: boolean;
    loadingAnalyze: boolean;
    loadingCustomMigrate: boolean;
    loadingCustomRestore: boolean;
    loadingRename: boolean;
    loadingUserProfile?: boolean;
    loadingAppSettings?: boolean;
}

export interface Space {
    id: string;
    name: string;
}

export interface UserProfile {
    id: string;
    clerkId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    role: 'ADMIN' | 'USER';
    isContentfulTokenSet: boolean;
}

export interface AppSettingsState {
    betaBannerEnabled: boolean;
    betaBannerText: string;
    tickerEnabled: boolean;
    tickerText: string;
    maxAssetSizeMB: number;
    maxBackupsPerUser: number;
    updatedAt?: string;
    updatedBy?: string;
}

export interface GlobalState {
    spaceId: string;
    donorEnvironments: Environment[];
    targetEnvironments: Environment[];
    backups: Backup[];
    selectedDonor: string;
    selectedTarget: string;
    selectedBackup: string;
    selectedRestoreTarget: string;
    selectedBackupEnv: string;
    useAdvanced: boolean;
    statusMessage: ReactNode | null;
    alertOpen: boolean;
    userProfile: UserProfile | null;
    appSettings: AppSettingsState | null;
    loading: LoadingState;
    errors: {
        profile: string | null;
        environments: Record<string, string | null>;
        [key: string]: string | null | Record<string, string | null>;
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
    restoreResult: {
        open: boolean;
        success: boolean;
        backupName?: string;
        targetEnvironment?: string;
        errorMessage?: string;
    };
}

export type Action =
    | { type: "SET_SPACE_ID"; payload: string }
    | { type: "SET_SOURCE_ENV"; payload: string }
    | { type: "SET_TARGET_ENV"; payload: string }
    | { type: "SET_DATA"; payload: Partial<GlobalState> }
    | { type: "SET_STATUS"; payload: ReactNode | null }
    | { type: "CLOSE_ALERT" }
    | { type: "SET_LOADING"; payload: { key: string; value: boolean } }

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
    | { type: "CLEAR_LOGS" }
    | { type: "SET_RESTORE_RESULT"; payload: { success: boolean; backupName?: string; targetEnvironment?: string; errorMessage?: string } }

    | { type: "CLOSE_RESTORE_RESULT" }
    | { type: "SET_USER_PROFILE"; payload: UserProfile | null }
    | { type: "SET_APP_SETTINGS"; payload: AppSettingsState | null }
    | { type: "RESET_SESSION" };
