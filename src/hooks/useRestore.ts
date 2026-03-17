import { useCallback, useRef, useState } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { api, ApiError } from "@/utils/api";
import { RestoreResponse } from "@/types/api";
import { parseError } from "@/utils/errorParser";

import { Backup } from "@/types/backup";
import type { Locale } from "@/types/common";

interface ValidationResult {
    status: 'ok' | 'mismatch';
    sourceLocales: Locale[];
    targetLocales: Locale[];
    details: {
        defaultMismatch: boolean;
        missingInTarget: string[];
    };
}

interface RestoreOptions {
    includeAssets?: boolean;
    assetFile?: File;
    backupFile?: File;
    contentTypes?: string[];
    locales?: string[];
    clearEnvironment?: boolean | string;
}

interface ValidationResponse {
    success: boolean;
    data: ValidationResult;
}

interface UseRestoreReturn {
    handleRestore: (backup: Backup | null, options?: RestoreOptions, fileContent?: unknown, targetEnvironment?: string) => Promise<void>;

    // Mapping UI State
    mappingModalOpen: boolean;
    validationResult: ValidationResult | null;
    confirmMapping: (mapping: Record<string, string>) => void;
    cancelMapping: () => void;
}

export function useRestore(): UseRestoreReturn {
    const { state, dispatch } = useGlobalContext();
    const stateRef = useRef(state);
    stateRef.current = state;

    const [mappingModalOpen, setMappingModalOpen] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [pendingBackup, setPendingBackup] = useState<Backup | null>(null);
    const [pendingOptions, setPendingOptions] = useState<{ options?: RestoreOptions, fileContent?: unknown, targetEnvironment?: string } | null>(null);

    const resetProgress = useCallback((dispatch: ReturnType<typeof useGlobalContext>['dispatch']) => {
        dispatch({
            type: "SET_RESTORE_PROGRESS",
            payload: {
                isActive: false,
                currentStep: 0,
                overallProgress: 0,
                restoringBackupName: undefined
            }
        });
    }, []);



    const performRestore = useCallback(async (backup: Backup | null, localeMapping?: Record<string, string>, options?: RestoreOptions, fileContent?: unknown, targetEnvironment?: string) => {
        const { spaceId, selectedTarget } = stateRef.current;
        const effectiveTarget = targetEnvironment || selectedTarget;

        const backupName = backup?.name || options?.backupFile?.name || 'local-backup.json';
        const backupId = backup?.id;

        try {
            if (!spaceId || (!backupId && !fileContent && !options?.backupFile) || !effectiveTarget) {
                throw new Error('Space ID, backup ID (or file/content), and target environment are required');
            }

            dispatch({
                type: "SET_RESTORE_PROGRESS",
                payload: {
                    isActive: true,
                    steps: [
                        { name: 'Initializing Restore', status: 'completed' },
                        { name: 'Restoring Content', status: 'in-progress' }
                    ],
                    currentStep: 1,
                    overallProgress: 10,
                    restoringBackupName: backupName
                }
            });

            let payload: FormData | object;
            // Use FormData if we have any files to upload
            if (options?.backupFile || (options?.includeAssets && options?.assetFile)) {
                const formData = new FormData();
                formData.append('spaceId', spaceId);
                formData.append('backupId', backupId || '');
                formData.append('fileName', backupName);
                formData.append('targetEnvironment', effectiveTarget);
                if (localeMapping) {
                    formData.append('localeMapping', JSON.stringify(localeMapping));
                }
                const opsToSave = { ...options };
                // Don't stringify File objects in options
                delete opsToSave.backupFile;
                delete opsToSave.assetFile;
                formData.append('options', JSON.stringify(opsToSave));
                if (fileContent) {
                    formData.append('backupContent', JSON.stringify(fileContent));
                }
                if (options?.assetFile) {
                    formData.append('assetZip', options.assetFile);
                }
                if (options?.backupFile) {
                    formData.append('backupFile', options.backupFile);
                }
                payload = formData;
            } else {
                payload = {
                    spaceId,
                    backupId: backupId,
                    fileName: backupName,
                    targetEnvironment: effectiveTarget,
                    localeMapping,
                    options,
                    backupContent: fileContent
                };
            }

            const response = await api.post<RestoreResponse>('/api/restore', payload);

            if (response.success) {
                resetProgress(dispatch);
                dispatch({ type: "CLEAR_ERROR_INSTRUCTION" });
                dispatch({
                    type: "SET_RESTORE_RESULT",
                    payload: {
                        success: true,
                        backupName: backupName,
                        targetEnvironment: selectedTarget
                    }
                });
            } else {
                throw new Error(response.error || 'Failed to restore backup');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to restore backup';
            const details = error instanceof ApiError ? error.details : undefined;
            const instruction = parseError(errorMessage);

            resetProgress(dispatch);

            if (instruction || details) {
                dispatch({
                    type: "SET_ERROR_INSTRUCTION",
                    payload: {
                        instruction: instruction || parseError('Generic Error'),
                        errorMessage: details || errorMessage,
                        backupFile: backupName
                    }
                });
            } else {
                dispatch({
                    type: "SET_RESTORE_RESULT",
                    payload: {
                        success: false,
                        backupName: backupName,
                        targetEnvironment: stateRef.current.selectedTarget,
                        errorMessage
                    }
                });
            }
        }
    }, [dispatch, resetProgress]);

    const handleRestore = useCallback(async (backup: Backup | null, options?: RestoreOptions, fileContent?: unknown, targetEnvironment?: string) => {
        const { spaceId, selectedTarget } = stateRef.current;
        const effectiveTarget = targetEnvironment || selectedTarget;

        if (!spaceId || !effectiveTarget) {
            return;
        }

        setPendingOptions({ options, fileContent, targetEnvironment: effectiveTarget });

        // If local backup file, skip validation since we don't have a backup ID and file might be too large for rapid parsing
        if (options?.backupFile || fileContent) {
            await performRestore(backup, undefined, options, fileContent, effectiveTarget);
            return;
        }

        // 1. Validate first for cloud backups
        try {
            dispatch({ type: "SET_LOADING", payload: { key: 'loadingMigration', value: true } });

            const response = await api.post<ValidationResponse>('/api/validate-restore', {
                spaceId,
                targetEnvironment: effectiveTarget,
                backupId: backup?.id,
                fileName: backup?.name, // Fallback
                options // Pass options for filtered validation
            });

            dispatch({ type: "SET_LOADING", payload: { key: 'loadingMigration', value: false } });

            if (response.success && response.data) {
                const responseBody = response.data;
                const validation = responseBody.data;

                if (validation && validation.status === 'mismatch') {
                    setValidationResult(validation);
                    setPendingBackup(backup);
                    setMappingModalOpen(true);
                } else {
                    await performRestore(backup, undefined, options, fileContent, effectiveTarget);
                }
            } else {
                await performRestore(backup, undefined, options, fileContent, effectiveTarget);
            }
        } catch (error) {
            dispatch({ type: "SET_LOADING", payload: { key: 'loadingMigration', value: false } });
            await performRestore(backup, undefined, options, fileContent, effectiveTarget);
        }
    }, [dispatch, performRestore]);

    const confirmMapping = useCallback((mapping: Record<string, string>) => {
        setMappingModalOpen(false);
        if (pendingBackup) {
            performRestore(
                pendingBackup,
                mapping,
                pendingOptions?.options,
                pendingOptions?.fileContent,
                pendingOptions?.targetEnvironment
            );
            setPendingBackup(null);
            setPendingOptions(null);
        }
    }, [pendingBackup, pendingOptions, performRestore]);

    const cancelMapping = useCallback(() => {
        setMappingModalOpen(false);
        setPendingBackup(null);
        setValidationResult(null);
    }, []);

    return {
        handleRestore,
        mappingModalOpen,
        validationResult,
        confirmMapping,
        cancelMapping
    };
}
