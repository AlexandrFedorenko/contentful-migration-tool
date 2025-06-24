import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Environment, LoadingState } from '@/types/common';
import { Backup } from '@/types/backup';

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
    errors: {}
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
    | { type: "SET_ERROR"; payload: { key: string; value: string | null } };

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
                alertOpen: true
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
