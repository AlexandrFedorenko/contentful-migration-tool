import { useState, useCallback } from 'react';
import { autoSuggestLocaleMapping, LocaleMapping } from '@/utils/locale-filter';
import type { BackupLocale } from '@/types/backup';

// Types

export interface CTSummary {
    id: string;
    name: string;
    description: string;
    displayField: string | null;
    fields: unknown[];
    totalEntries: number;
    sampleTitles: string[];
    sampleEntries?: Array<{
        id: string;
        fields: Record<string, unknown>;
        sys: {
            version: number;
            publishedVersion?: number;
        };
    }>;
    resolvedAssets?: Record<string, { url: string; title: string; isImage?: boolean }>;
    resolvedEntries?: Record<string, { title: string; contentType?: string }>;
}
export interface PreviewData {
    contentTypes: CTSummary[];
    locales: BackupLocale[];
    ctDependencyMap: Record<string, string[]>;
    totalContentTypes: number;
}

export interface TransferStats {
    contentTypes: number;
    entries: { success: number; failed: number };
    assets: number;
}

export interface SmartRestoreOptions {
    clearEnvironment: boolean;
    includeAssets: boolean;
    mergeMode: 'upsert' | 'skip-existing';
}

type ActionMode = 'transfer' | 'export';
type Status = 'idle' | 'loading-preview' | 'ready' | 'running' | 'done' | 'error';

// useSmartRestore Hook

export function useSmartRestore() {
    // Source selection
    const [sourceSpaceId, setSourceSpaceId] = useState('');
    const [sourceEnvironmentId, setSourceEnvironmentId] = useState('');

    // Preview data
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);

    // Content selection
    const [selectedCTIds, setSelectedCTIds] = useState<Set<string>>(new Set());
    const [autoDeps, setAutoDeps] = useState<Set<string>>(new Set());
    const [selectedLocales, setSelectedLocales] = useState<Set<string>>(new Set());
    const [localeMapping, setLocaleMapping] = useState<LocaleMapping>({});

    // Target selection (for transfer)
    const [targetSpaceId, setTargetSpaceId] = useState('');
    const [targetEnvironmentId, setTargetEnvironmentId] = useState('');
    const [targetLocales, setTargetLocales] = useState<BackupLocale[]>([]);

    // Action
    const [actionMode, setActionMode] = useState<ActionMode>('transfer');
    const [options, setOptions] = useState<SmartRestoreOptions>({
        clearEnvironment: false,
        includeAssets: false,
        mergeMode: 'upsert',
    });

    // Result
    const [resultStats, setResultStats] = useState<TransferStats | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // Load preview from CMA
    const loadPreview = useCallback(async (spaceId: string, environmentId: string) => {
        setStatus('loading-preview');
        setError(null);
        setPreview(null);
        setSelectedCTIds(new Set());
        setAutoDeps(new Set());
        setSelectedLocales(new Set());

        try {
            const res = await fetch(
                `/api/smart-restore/cma-preview?spaceId=${encodeURIComponent(spaceId)}&environmentId=${encodeURIComponent(environmentId)}`
            );
            const json = await res.json();
            if (!json.success) throw new Error(json.error);

            setPreview(json.data as PreviewData);
            setStatus('ready');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load preview');
            setStatus('error');
        }
    }, []);

    // Load target locales (for locale mapping modal)
    const loadTargetLocales = useCallback(async (spaceId: string, environmentId: string) => {
        if (!spaceId || !environmentId) return;
        try {
            const res = await fetch(
                `/api/smart-restore/cma-preview?spaceId=${encodeURIComponent(spaceId)}&environmentId=${encodeURIComponent(environmentId)}`
            );
            const json = await res.json();
            if (json.success && json.data?.locales) {
                setTargetLocales(json.data.locales as BackupLocale[]);
                // Auto-suggest mapping whenever target locales change
                if (preview?.locales) {
                    const suggested = autoSuggestLocaleMapping(preview.locales, json.data.locales);
                    if (Object.keys(suggested).length > 0) {
                        setLocaleMapping(prev => ({ ...suggested, ...prev }));
                    }
                }
            }
        } catch { /* non-critical */ }
    }, [preview?.locales]);

    // CT selection logic (with auto-deps)
    const toggleCT = useCallback((ctId: string, checked: boolean) => {
        setSelectedCTIds(prev => {
            const next = new Set(prev);
            if (checked) {
                next.add(ctId);
                // Add auto-deps
                const deps = preview?.ctDependencyMap?.[ctId] ?? [];
                const newAutoDeps = new Set<string>();
                for (const dep of deps) {
                    next.add(dep);
                    newAutoDeps.add(dep);
                }
                setAutoDeps(ad => new Set([...ad, ...newAutoDeps]));
            } else {
                next.delete(ctId);
                // Recalculate auto-deps (may still be needed by other selected CTs)
                setAutoDeps(_ => {
                    const stillNeeded = new Set<string>();
                    for (const selectedId of next) {
                        const deps = preview?.ctDependencyMap?.[selectedId] ?? [];
                        deps.forEach(d => stillNeeded.add(d));
                    }
                    return stillNeeded;
                });
            }
            return next;
        });
    }, [preview?.ctDependencyMap]);

    const toggleLocale = useCallback((code: string, checked: boolean) => {
        setSelectedLocales(prev => {
            const next = new Set(prev);

            // If the set is currently empty (meaning ALL locales are implicitly selected),
            // and the user unchecks one, we must explicitly add all OTHER locales to the set.
            if (!checked && prev.size === 0 && preview) {
                preview.locales.forEach(l => {
                    if (l.code !== code) next.add(l.code);
                });
                return next;
            }

            if (checked) next.add(code);
            else next.delete(code);
            return next;
        });
    }, [preview]);

    const selectAllCTs = useCallback(() => {
        if (!preview) return;
        const all = new Set(preview.contentTypes.map(ct => ct.id));
        setSelectedCTIds(all);
    }, [preview]);

    const clearAllCTs = useCallback(() => {
        setSelectedCTIds(new Set());
        setAutoDeps(new Set());
    }, []);

    // Execute Live Transfer (SSE streaming)
    const executeTransfer = useCallback(async () => {
        if (!sourceSpaceId || !sourceEnvironmentId || !targetSpaceId || !targetEnvironmentId) return;

        setStatus('running');
        setError(null);
        setLogs([]);

        try {
            const response = await fetch('/api/smart-restore/live-transfer-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceSpaceId,
                    sourceEnvironmentId,
                    targetSpaceId,
                    targetEnvironmentId,
                    selectedContentTypeIds: Array.from(selectedCTIds),
                    selectedLocales: Array.from(selectedLocales),
                    localeMapping,
                    options,
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // Parse SSE data lines
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const event = JSON.parse(line.slice(6));
                        if (event.type === 'log') {
                            setLogs((prev: string[]) => [...prev, event.payload as string]);
                        } else if (event.type === 'done') {
                            setResultStats(event.payload.stats as TransferStats);
                            setStatus('done');
                        } else if (event.type === 'error') {
                            setError(event.payload as string);
                            setStatus('error');
                        }
                    } catch { /* malformed SSE line */ }
                }
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Transfer failed');
            setStatus('error');
        }
    }, [sourceSpaceId, sourceEnvironmentId, targetSpaceId, targetEnvironmentId,
        selectedCTIds, selectedLocales, localeMapping, options]);

    // Execute Smart Export
    const executeExport = useCallback(async (): Promise<{
        exportData: unknown;
        stats: unknown;
        assetFileUrls: Array<{ id: string; url: string; fileName: string }>;
    } | null> => {
        if (!sourceSpaceId || !sourceEnvironmentId) return null;

        setStatus('running');
        setError(null);

        try {
            const res = await fetch('/api/smart-restore/smart-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId: sourceSpaceId,
                    environmentId: sourceEnvironmentId,
                    selectedContentTypeIds: Array.from(selectedCTIds),
                    selectedLocales: Array.from(selectedLocales),
                    localeMapping,
                    includeAssets: options.includeAssets,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);

            setStatus('done');
            return json.data;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Export failed');
            setStatus('error');
            return null;
        }
    }, [sourceSpaceId, sourceEnvironmentId, selectedCTIds, selectedLocales, localeMapping, options.includeAssets]);

    return {
        // State
        sourceSpaceId, setSourceSpaceId,
        sourceEnvironmentId, setSourceEnvironmentId,
        targetSpaceId, setTargetSpaceId,
        targetEnvironmentId, setTargetEnvironmentId,
        targetLocales,
        preview,
        status,
        error,
        selectedCTIds,
        autoDeps,
        selectedLocales,
        localeMapping, setLocaleMapping,
        actionMode, setActionMode,
        options, setOptions,
        resultStats,
        logs,

        // Actions
        loadPreview,
        loadTargetLocales,
        toggleCT,
        toggleLocale,
        selectAllCTs,
        clearAllCTs,
        executeTransfer,
        executeExport,

        // Computed
        hasSelection: selectedCTIds.size > 0,
        isLoading: status === 'loading-preview' || status === 'running',
        isDone: status === 'done',
    };
}
