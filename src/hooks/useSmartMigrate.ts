import { useState, useCallback, useMemo, useEffect } from 'react';
import { autoSuggestLocaleMapping, LocaleMapping } from '@/utils/locale-filter';
import type { CTDiffItem, LocaleDiffItem, MigrateDiffResult, EntryDiffItem } from '@/types/smart-migrate';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TransferStats {
    contentTypes: number;
    entries: { success: number; failed: number };
    assets: number;
}

export interface SmartMigrateOptions {
    clearEnvironment: boolean;
    includeAssets: boolean;
    mergeMode: 'upsert' | 'skip-existing';
}

type Status = 'idle' | 'loading-diff' | 'ready' | 'running' | 'done' | 'error';

export type { CTDiffItem, LocaleDiffItem, MigrateDiffResult, EntryDiffItem };

export interface DiffEntriesResult {
    entries: EntryDiffItem[];
    resolvedAssets: Record<string, { url: string; title: string; isImage: boolean }>;
    resolvedEntries: Record<string, { title: string; contentType?: string }>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useSmartMigrate() {
    // Source selection
    const [sourceSpaceId, setSourceSpaceId] = useState('');
    const [sourceEnvironmentId, setSourceEnvironmentId] = useState('');

    // Target selection
    const [targetSpaceId, setTargetSpaceId] = useState('');
    const [targetEnvironmentId, setTargetEnvironmentId] = useState('');

    // Diff data
    const [diff, setDiff] = useState<MigrateDiffResult | null>(null);
    const [entriesMap, setEntriesMap] = useState<Record<string, DiffEntriesResult>>({});
    const [loadingEntries, setLoadingEntries] = useState<Set<string>>(new Set());
    const [analyzedCTs, setAnalyzedCTs] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);

    // Selection: which CTs to migrate
    const [selectedCTIds, setSelectedCTIds] = useState<Set<string>>(new Set());
    const [autoDeps, setAutoDeps] = useState<Set<string>>(new Set());

    // Selection: which individual entries to migrate
    const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

    // Selection: which locales to migrate
    const [selectedLocales, setSelectedLocales] = useState<Set<string>>(new Set());
    const [localeMapping, setLocaleMapping] = useState<LocaleMapping>({});

    // Options
    const [options, setOptions] = useState<SmartMigrateOptions>({
        clearEnvironment: false,
        includeAssets: true,
        mergeMode: 'upsert',
    });

    // Result
    const [resultStats, setResultStats] = useState<TransferStats | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // ── Load live diff ───────────────────────────────────────────────────────
    const loadDiff = useCallback(async (
        srcSpace: string,
        srcEnv: string,
        tgtSpace: string,
        tgtEnv: string
    ) => {
        setStatus('loading-diff');
        setError(null);
        setDiff(null);
        setSelectedCTIds(new Set());
        setAutoDeps(new Set());
        setSelectedEntryIds(new Set());
        setSelectedLocales(new Set());
        setEntriesMap({});
        setAnalyzedCTs(new Set());

        try {
            const params = new URLSearchParams({
                sourceSpaceId: srcSpace,
                sourceEnvId: srcEnv,
                targetSpaceId: tgtSpace,
                targetEnvId: tgtEnv,
            });
            const res = await fetch(`/api/smart-migrate/cma-diff?${params}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error);

            const data = json.data as MigrateDiffResult;
            setDiff(data);
            setStatus('ready');

            // Auto-suggest locale mapping if codes differ
            if (data.sourceLocales && data.targetLocales) {
                const suggested = autoSuggestLocaleMapping(data.sourceLocales, data.targetLocales);
                if (Object.keys(suggested).length > 0) {
                    setLocaleMapping(suggested);
                }
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load diff');
            setStatus('error');
        }
    }, []);

    // ── Load entries for CT ──────────────────────────────────────────────────
    const loadEntries = useCallback(async (ctId: string, skip = 0, limit = 100) => {
        if (!sourceSpaceId || !sourceEnvironmentId || !targetSpaceId || !targetEnvironmentId) return;

        setLoadingEntries(prev => new Set(prev).add(ctId));

        try {
            const params = new URLSearchParams({
                sourceSpaceId,
                sourceEnvId: sourceEnvironmentId,
                targetSpaceId,
                targetEnvId: targetEnvironmentId,
                contentTypeId: ctId,
                skip: skip.toString(),
                limit: limit.toString()
            });
            const res = await fetch(`/api/smart-migrate/diff-entries?${params}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error);

            setEntriesMap(prev => {
                const existing = prev[ctId];
                if (!existing) return { ...prev, [ctId]: json.data };

                // Merge if paginating (for future use)
                return {
                    ...prev,
                    [ctId]: {
                        entries: [...existing.entries, ...json.data.entries],
                        resolvedAssets: { ...existing.resolvedAssets, ...json.data.resolvedAssets },
                        resolvedEntries: { ...existing.resolvedEntries, ...json.data.resolvedEntries }
                    }
                };
            });
        } catch {
            // Silently continue on entry load failure
        } finally {
            setLoadingEntries(prev => {
                const next = new Set(prev);
                next.delete(ctId);
                return next;
            });
        }
    }, [sourceSpaceId, sourceEnvironmentId, targetSpaceId, targetEnvironmentId]);

    // ── Background Progressive Loader ────────────────────────────────────────
    useEffect(() => {
        if (!diff || status !== 'ready') return;

        const ctsToAnalyze = diff.contentTypes.filter(ct =>
            (ct.totalSourceEntries > 0 || ct.totalTargetEntries > 0) &&
            !entriesMap[ct.id] &&
            !loadingEntries.has(ct.id) &&
            !analyzedCTs.has(ct.id)
        );

        if (ctsToAnalyze.length === 0) return;

        // Take up to 3 at a time
        const batch = ctsToAnalyze.slice(0, 3);

        batch.forEach(ct => {
            setAnalyzedCTs(prev => new Set(prev).add(ct.id));
            loadEntries(ct.id).catch(() => { /* ignore */ });
        });
    }, [diff, status, entriesMap, loadingEntries, analyzedCTs, loadEntries]);

    // ── CT selection (with auto-deps from diff dependency map) ──────────────
    const toggleCT = useCallback((ctId: string, checked: boolean) => {
        setSelectedCTIds(prev => {
            const next = new Set(prev);
            if (checked) {
                next.add(ctId);
                const deps = diff?.ctDependencyMap?.[ctId] ?? [];
                const newAutoDeps = new Set<string>();
                for (const dep of deps) {
                    next.add(dep);
                    newAutoDeps.add(dep);
                }
                setAutoDeps(ad => new Set([...ad, ...newAutoDeps]));

                // Auto-select all NEW + MODIFIED entries for this CT (if loaded)
                const loadedData = entriesMap[ctId];
                if (loadedData) {
                    setSelectedEntryIds(prevEntries => {
                        const nextEntries = new Set(prevEntries);
                        for (const entry of loadedData.entries) {
                            if (entry.diffStatus === 'NEW' || entry.diffStatus === 'MODIFIED') {
                                nextEntries.add(entry.id);
                            }
                        }
                        return nextEntries;
                    });
                }
            } else {
                next.delete(ctId);
                setAutoDeps(_ => {
                    const stillNeeded = new Set<string>();
                    for (const selectedId of next) {
                        const deps = diff?.ctDependencyMap?.[selectedId] ?? [];
                        deps.forEach(d => stillNeeded.add(d));
                    }
                    return stillNeeded;
                });

                // Deselect all entries for this CT (if loaded)
                const loadedData = entriesMap[ctId];
                if (loadedData) {
                    setSelectedEntryIds(prevEntries => {
                        const nextEntries = new Set(prevEntries);
                        for (const entry of loadedData.entries) {
                            nextEntries.delete(entry.id);
                        }
                        return nextEntries;
                    });
                }
            }
            return next;
        });
    }, [diff?.ctDependencyMap, entriesMap]);

    // ── Entry-level selection ────────────────────────────────────────────────
    const toggleEntry = useCallback((entryId: string, checked: boolean) => {
        setSelectedEntryIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(entryId);
            else next.delete(entryId);
            return next;
        });
    }, []);

    const selectAllEntriesForCT = useCallback((ctId: string) => {
        const loadedData = entriesMap[ctId];
        if (!loadedData) return;
        setSelectedEntryIds(prev => {
            const next = new Set(prev);
            for (const entry of loadedData.entries) {
                if (entry.diffStatus !== 'DELETED') {
                    next.add(entry.id);
                }
            }
            return next;
        });
    }, [entriesMap]);

    const clearEntriesForCT = useCallback((ctId: string) => {
        const loadedData = entriesMap[ctId];
        if (!loadedData) return;
        setSelectedEntryIds(prev => {
            const next = new Set(prev);
            for (const entry of loadedData.entries) {
                next.delete(entry.id);
            }
            return next;
        });
    }, [entriesMap]);

    const selectAllCTs = useCallback(() => {
        if (!diff) return;
        const all = new Set(diff.contentTypes.filter(ct => ct.diffStatus !== 'DELETED').map(ct => ct.id));
        setSelectedCTIds(all);

        // Auto-select all changed entries for loaded CTs
        const entryIds = new Set<string>();
        for (const ctId of all) {
            const loadedData = entriesMap[ctId];
            if (loadedData) {
                for (const entry of loadedData.entries) {
                    if (entry.diffStatus !== 'DELETED') {
                        entryIds.add(entry.id);
                    }
                }
            }
        }
        setSelectedEntryIds(entryIds);
    }, [diff, entriesMap]);

    const selectChangedCTs = useCallback(() => {
        if (!diff) return;
        // Without entries loaded, we can only rely on CT status
        // We removed `changedEntryCount` from backend to speed it up.
        // We will select CTs that are NEW or MODIFIED.
        const changed = new Set(
            diff.contentTypes
                .filter(ct => ct.diffStatus === 'NEW' || ct.diffStatus === 'MODIFIED')
                .map(ct => ct.id)
        );
        setSelectedCTIds(changed);
        setAutoDeps(new Set());

        // Auto-select all NEW + MODIFIED entries for changed CTs (if loaded)
        const entryIds = new Set<string>();
        for (const ctId of changed) {
            const loadedData = entriesMap[ctId];
            if (loadedData) {
                for (const entry of loadedData.entries) {
                    if (entry.diffStatus === 'NEW' || entry.diffStatus === 'MODIFIED') {
                        entryIds.add(entry.id);
                    }
                }
            }
        }
        setSelectedEntryIds(entryIds);
    }, [diff, entriesMap]);

    const clearAllCTs = useCallback(() => {
        setSelectedCTIds(new Set());
        setAutoDeps(new Set());
        setSelectedEntryIds(new Set());
    }, []);

    const selectAllChanged = useCallback(() => {
        if (!diff) return;
        // Select all CTs that are NEW/MODIFIED
        const ctIds = new Set<string>();
        const entryIds = new Set<string>();
        for (const ct of diff.contentTypes) {
            if (ct.diffStatus === 'DELETED') continue;
            if (ct.diffStatus === 'NEW' || ct.diffStatus === 'MODIFIED') {
                ctIds.add(ct.id);
                const loadedData = entriesMap[ct.id];
                if (loadedData) {
                    for (const entry of loadedData.entries) {
                        if (entry.diffStatus === 'NEW' || entry.diffStatus === 'MODIFIED') {
                            entryIds.add(entry.id);
                        }
                    }
                }
            }
        }

        // Also add auto deps
        const newAutoDeps = new Set<string>();
        for (const ctId of ctIds) {
            const deps = diff.ctDependencyMap?.[ctId] ?? [];
            for (const d of deps) {
                ctIds.add(d);
                newAutoDeps.add(d);
            }
        }

        setSelectedCTIds(ctIds);
        setAutoDeps(newAutoDeps);
        setSelectedEntryIds(entryIds);

        // Locales
        const changedLocales = diff.locales.filter(l => l.diffStatus === 'NEW' || l.diffStatus === 'MODIFIED').map(l => l.code);
        setSelectedLocales(new Set(changedLocales));
    }, [diff, entriesMap]);

    const toggleLocale = useCallback((code: string, checked: boolean) => {
        setSelectedLocales(prev => {
            const next = new Set(prev);
            if (checked) next.add(code);
            else next.delete(code);
            return next;
        });
    }, []);

    const selectChangedLocales = useCallback(() => {
        if (!diff) return;
        const changed = new Set(
            diff.locales
                .filter(l => l.diffStatus === 'NEW' || l.diffStatus === 'MODIFIED')
                .map(l => l.code)
        );
        setSelectedLocales(changed);
    }, [diff]);

    // ── Computed values ──────────────────────────────────────────────────────
    const selectedEntryCount = selectedEntryIds.size;
    const changedEntryCount = useMemo(() => {
        if (!diff) return 0;
        let count = 0;
        for (const ct of diff.contentTypes) {
            count += ct.changedEntryCount;
        }
        return count;
    }, [diff]);

    // ── Execute migration (SSE streaming) ────────────────────────────────────
    const executeMigration = useCallback(async () => {
        if (!sourceSpaceId || !sourceEnvironmentId || !targetSpaceId || !targetEnvironmentId) return;

        setStatus('running');
        setError(null);
        setLogs([]);

        try {
            const response = await fetch('/api/smart-migrate/live-migrate-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceSpaceId,
                    sourceEnvironmentId,
                    targetSpaceId,
                    targetEnvironmentId,
                    selectedContentTypeIds: Array.from(selectedCTIds),
                    selectedEntryIds: Array.from(selectedEntryIds),
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
            setError(e instanceof Error ? e.message : 'Migration failed');
            setStatus('error');
        }
    }, [sourceSpaceId, sourceEnvironmentId, targetSpaceId, targetEnvironmentId,
        selectedCTIds, selectedEntryIds, selectedLocales, localeMapping, options]);

    return {
        // State
        sourceSpaceId, setSourceSpaceId,
        sourceEnvironmentId, setSourceEnvironmentId,
        targetSpaceId, setTargetSpaceId,
        targetEnvironmentId, setTargetEnvironmentId,
        diff,
        entriesMap,
        loadingEntries,
        analyzedCTs,
        status,
        error,
        selectedCTIds,
        autoDeps,
        selectedEntryIds,
        selectedLocales,
        localeMapping, setLocaleMapping,
        options, setOptions,
        resultStats,
        logs,

        // Actions
        loadDiff,
        loadEntries,
        toggleCT,
        toggleEntry,
        selectAllEntriesForCT,
        clearEntriesForCT,
        toggleLocale,
        selectAllCTs,
        selectChangedCTs,
        selectAllChanged,
        clearAllCTs,
        selectChangedLocales,
        executeMigration,

        // Computed
        hasSelection: selectedCTIds.size > 0,
        selectedEntryCount,
        changedEntryCount,
        isLoading: status === 'loading-diff' || status === 'running',
        isDone: status === 'done',
        isReady: status === 'ready',
    };
}
