import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
    ArrowLeft, Loader2, CheckCircle2, AlertCircle, Send,
    Layers, Globe, Settings2, RefreshCw, Zap,
    Info, GitMerge, Network,
    Search, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SpaceSelector from '@/components/SpaceSelector/SpaceSelector';
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector';
import { useGlobalContext } from '@/context/GlobalContext';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useSpaces } from '@/hooks/useSpaces';
import { useSmartMigrate } from '@/hooks/useSmartMigrate';
import { MigrateCTRow, MigrateLocaleRow } from '@/components/SmartMigrate/SmartMigrateComponents';
import { LocaleRemapModal } from '@/components/LocaleRemapModal/LocaleRemapModal';
import { PageHelp } from '@/components/PageHelp/PageHelp';
import { TabIndex } from '@/hooks/useDocumentationTabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

export default function SmartMigrationPage() {
    const router = useRouter();
    const { state } = useGlobalContext();
    const { loadEnvironments } = useEnvironments();
    const { spaces } = useSpaces();
    const sm = useSmartMigrate();

    const [targetEnvList, setTargetEnvList] = useState<{ id: string; name: string }[]>([]);
    const [localeRemapOpen, setLocaleRemapOpen] = useState(false);
    const [ctSearch, setCTSearch] = useState('');
    const [entrySearch, setEntrySearch] = useState('');
    const [showFilter, setShowFilter] = useState<'changed' | 'all'>('changed');

    useEffect(() => {
        if (state.spaceId) {
            sm.setSourceSpaceId(state.spaceId);
            sm.setTargetSpaceId(state.spaceId);
            loadEnvironments(state.spaceId);
        }
    }, [state.spaceId, loadEnvironments]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!sm.targetSpaceId) return;
        fetch(`/api/environments?spaceId=${sm.targetSpaceId}`)
            .then(r => r.json())
            .then(j => setTargetEnvList(j.data?.environments ?? []))
            .catch(() => { });
    }, [sm.targetSpaceId]);

    const handleLoadDiff = () => {
        if (sm.sourceSpaceId && sm.sourceEnvironmentId && sm.targetSpaceId && sm.targetEnvironmentId) {
            sm.loadDiff(sm.sourceSpaceId, sm.sourceEnvironmentId, sm.targetSpaceId, sm.targetEnvironmentId);
        }
    };

    const canLoadDiff = !!(sm.sourceSpaceId && sm.sourceEnvironmentId && sm.targetSpaceId && sm.targetEnvironmentId);
    const summary = sm.diff?.summary;

    const filteredCTs = useMemo(() => {
        if (!sm.diff) return [];
        let cts = sm.diff.contentTypes;
        if (showFilter === 'changed') {
            cts = cts.filter(ct => {
                if (ct.diffStatus !== 'EQUAL') return true;
                if (ct.totalSourceEntries !== ct.totalTargetEntries) return true;
                if (sm.loadingEntries.has(ct.id)) return true;

                // Keep visible if it has entries but hasn't been analyzed yet
                if (!sm.analyzedCTs.has(ct.id) && (ct.totalSourceEntries > 0 || ct.totalTargetEntries > 0)) {
                    return true;
                }

                const loadedEntries = sm.entriesMap[ct.id]?.entries;
                if (loadedEntries) {
                    return loadedEntries.some(e => e.diffStatus !== 'EQUAL');
                }

                return false;
            });
        }
        if (ctSearch) {
            const q = ctSearch.toLowerCase();
            cts = cts.filter(ct => ct.name.toLowerCase().includes(q) || ct.id.toLowerCase().includes(q));
        }
        return cts;
    }, [sm.diff, showFilter, ctSearch, sm.entriesMap, sm.loadingEntries, sm.analyzedCTs]);

    return (
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="hover:bg-muted group">
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                            <GitMerge className="h-7 w-7 text-primary" />
                            Smart Migrate
                        </h1>
                        <PageHelp
                            description="Real-time diff between environments — selectively migrate CTs, entries and locales"
                            docTab={TabIndex.SMART_MIGRATE}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Real-time diff between environments — selectively migrate CTs, entries and locales
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* 1. Environment selection */}
                <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                            <Network className="h-4 w-4 text-primary" />
                            Environments
                        </CardTitle>
                        <CardDescription className="text-base">Select source and target environments to compare</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                <Network className="h-3.5 w-3.5" /> Source (from)
                            </Label>
                            <SpaceSelector />
                            {state.spaceId && (
                                <EnvironmentSelector
                                    environments={state.donorEnvironments ?? []}
                                    value={sm.sourceEnvironmentId}
                                    onChange={(v) => sm.setSourceEnvironmentId(v)}
                                    label="Source Environment"
                                />
                            )}
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-2">
                            <Label className="text-base font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                                Target (to)
                            </Label>
                            <Select
                                value={sm.targetSpaceId || "NO_SELECTION_PLACEHOLDER"}
                                onValueChange={(v) => {
                                    if (v !== "NO_SELECTION_PLACEHOLDER") {
                                        sm.setTargetSpaceId(v);
                                        sm.setTargetEnvironmentId('');
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full bg-background/50 text-base h-11">
                                    <SelectValue placeholder="Select target space..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NO_SELECTION_PLACEHOLDER" disabled className="text-muted-foreground italic">
                                        Select target space...
                                    </SelectItem>
                                    {spaces.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} <span className="text-[10px] opacity-50 ml-1">({s.id})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {sm.targetSpaceId && (
                                <EnvironmentSelector
                                    environments={targetEnvList}
                                    value={sm.targetEnvironmentId}
                                    onChange={sm.setTargetEnvironmentId}
                                    label="Target Environment"
                                />
                            )}
                        </div>

                        <Button
                            onClick={handleLoadDiff}
                            disabled={!canLoadDiff || sm.isLoading}
                            className="w-full h-14 text-lg font-extrabold bg-primary/90 hover:bg-primary"
                        >
                            {sm.status === 'loading-diff' ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Comparing environments...</>
                            ) : (
                                <><RefreshCw className="mr-2 h-5 w-5" />Load Live Diff</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Diff preview */}
                {sm.diff && (
                    <Card className="border-white/5 bg-card/20 backdrop-blur-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-emerald-400" />
                                    Diff Preview
                                </CardTitle>
                                {summary && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {(summary.newEntries > 0 || summary.newCTs > 0) && (
                                            <span className="text-base font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                +{summary.newEntries} entries {summary.newCTs > 0 && `· +${summary.newCTs} CT`}
                                            </span>
                                        )}
                                        {(summary.modifiedEntries > 0 || summary.modifiedCTs > 0) && (
                                            <span className="text-base font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                ~{summary.modifiedEntries} entries {summary.modifiedCTs > 0 && `· ~${summary.modifiedCTs} CT`}
                                            </span>
                                        )}
                                        {summary.deletedEntries > 0 && (
                                            <span className="text-base font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                -{summary.deletedEntries}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex flex-col gap-6">
                                {/* Locales */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-base font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                            <Globe className="h-3.5 w-3.5" /> Locales
                                        </Label>
                                        <div className="flex gap-4">
                                            <button onClick={sm.selectChangedLocales} className="text-base text-primary font-bold hover:underline">
                                                Changes only
                                            </button>
                                            <button
                                                onClick={() => setLocaleRemapOpen(true)}
                                                className="flex items-center gap-1.5 text-base text-primary font-bold hover:underline"
                                            >
                                                <Settings2 className="h-3.5 w-3.5" />
                                                Remap
                                            </button>
                                        </div>
                                    </div>

                                    {Object.keys(sm.localeMapping).length > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-base text-primary font-bold">
                                            <Globe className="h-3.5 w-3.5 shrink-0" />
                                            {Object.entries(sm.localeMapping).map(([src, tgt]) => `${src}→${tgt}`).join(', ')}
                                        </div>
                                    )}

                                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                        {sm.diff.locales.map((locale) => (
                                            <MigrateLocaleRow
                                                key={locale.code}
                                                locale={locale}
                                                checked={sm.selectedLocales.has(locale.code)}
                                                remappedTo={sm.localeMapping[locale.code]}
                                                onToggle={sm.toggleLocale}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <Separator className="bg-border/50" />

                                {/* Content Types + Entries */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                            <Layers className="h-3.5 w-3.5" /> Content Types & Entries
                                        </Label>
                                        <div className="flex gap-3 text-base">
                                            <button onClick={sm.selectAllChanged} className="text-primary font-bold hover:underline">All changes</button>
                                            <span className="text-muted-foreground/30">·</span>
                                            <button onClick={sm.selectAllCTs} className="text-primary font-bold hover:underline">All</button>
                                            <span className="text-muted-foreground/30">·</span>
                                            <button onClick={sm.clearAllCTs} className="text-muted-foreground font-bold hover:underline">None</button>
                                        </div>
                                    </div>

                                    {/* Search + Filter bar */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                            <input
                                                type="text"
                                                value={ctSearch}
                                                onChange={(e) => setCTSearch(e.target.value)}
                                                placeholder="Search content types..."
                                                className="w-full pl-9 pr-3 py-2 text-base rounded-lg border border-border/50 bg-card/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                            <input
                                                type="text"
                                                value={entrySearch}
                                                onChange={(e) => setEntrySearch(e.target.value)}
                                                placeholder="Search entries..."
                                                className="w-full pl-9 pr-3 py-2 text-base rounded-lg border border-border/50 bg-card/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowFilter(f => f === 'changed' ? 'all' : 'changed')}
                                            className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-base font-bold uppercase tracking-wider transition-all ${showFilter === 'changed'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                                : 'border-border/50 bg-muted/20 text-muted-foreground'
                                                }`}
                                        >
                                            <Filter className="h-4 w-4" />
                                            {showFilter === 'changed' ? 'Changed' : 'All'}
                                        </button>
                                    </div>

                                    {/* CT list */}
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                                        {filteredCTs.map((ct) => (
                                            <MigrateCTRow
                                                key={ct.id}
                                                ct={ct}
                                                checked={sm.selectedCTIds.has(ct.id)}
                                                isAutoDep={sm.autoDeps.has(ct.id) && !sm.selectedCTIds.has(ct.id)}
                                                onToggle={sm.toggleCT}
                                                entriesData={sm.entriesMap[ct.id]}
                                                isLoadingEntries={sm.loadingEntries.has(ct.id)}
                                                onLoadEntries={sm.loadEntries}
                                                selectedEntryIds={sm.selectedEntryIds}
                                                onToggleEntry={sm.toggleEntry}
                                                onSelectAllEntries={sm.selectAllEntriesForCT}
                                                onClearEntries={sm.clearEntriesForCT}
                                                entrySearch={entrySearch}
                                                hideUnchanged={showFilter === 'changed'}
                                            />
                                        ))}
                                        {filteredCTs.length === 0 && (
                                            <div className="text-center py-8 text-base text-muted-foreground/40">
                                                {showFilter === 'changed'
                                                    ? 'No changes detected between environments'
                                                    : 'No content types match your search'
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 3. Action panel (Migration) */}
                {sm.isReady || sm.isDone || sm.status === 'running' ? (
                    sm.diff && sm.hasSelection ? (
                        <>
                            <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
                                <CardHeader className="pb-3 border-b border-border/50">
                                    <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                                        <Send className="h-4 w-4 text-primary" />
                                        Migration
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        {sm.selectedCTIds.size} CT{sm.selectedCTIds.size !== 1 ? 's' : ''}
                                        {' · '}{sm.selectedEntryCount} entr{sm.selectedEntryCount !== 1 ? 'ies' : 'y'}
                                        {sm.selectedLocales.size > 0 ? ` · ${sm.selectedLocales.size} locale${sm.selectedLocales.size !== 1 ? 's' : ''}` : ' · all locales'}
                                        {' '}selected
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <div className="space-y-3">
                                        <Label className="text-base font-black uppercase tracking-widest text-muted-foreground block">Options</Label>

                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                                            <Checkbox
                                                id="include-assets"
                                                checked={sm.options.includeAssets}
                                                onCheckedChange={(v) => sm.setOptions(o => ({ ...o, includeAssets: !!v }))}
                                                className="mt-0.5 h-5 w-5"
                                            />
                                            <div>
                                                <Label htmlFor="include-assets" className="text-base font-bold cursor-pointer">Include assets</Label>
                                                <p className="text-base text-muted-foreground">Transfer asset metadata to target via CMA</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                            <div className="flex-1">
                                                <Label className="text-base font-bold">Merge Mode</Label>
                                                <p className="text-base text-muted-foreground">How to handle existing entries in target</p>
                                            </div>
                                            <select
                                                className="text-base rounded-lg border border-border/50 bg-card/50 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                value={sm.options.mergeMode}
                                                onChange={(e) => sm.setOptions(o => ({ ...o, mergeMode: e.target.value as 'upsert' | 'skip-existing' }))}
                                            >
                                                <option value="upsert">Upsert (update existing)</option>
                                                <option value="skip-existing">Skip existing</option>
                                            </select>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={sm.executeMigration}
                                        disabled={!sm.targetSpaceId || !sm.targetEnvironmentId || sm.isLoading}
                                        className="w-full h-14 text-lg font-extrabold bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90"
                                    >
                                        {sm.isLoading ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Migrating...</>
                                        ) : (
                                            <><Zap className="mr-2 h-5 w-5" />Execute Migration</>
                                        )}
                                    </Button>

                                    {!sm.isLoading && !sm.isDone && (
                                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-base text-amber-400">
                                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>A safety backup of the target env will be created automatically before any write.</span>
                                        </div>
                                    )}

                                    {/* Live log console */}
                                    {(sm.isLoading || sm.logs.length > 0) && (
                                        <div className="rounded-xl border border-border/50 bg-muted/30 overflow-hidden mt-6">
                                            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/20">
                                                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-base font-black uppercase tracking-widest text-muted-foreground">Migration Log</span>
                                                <span className="ml-auto text-base text-muted-foreground/50 font-mono">{sm.logs.length} lines</span>
                                            </div>
                                            <div className="p-5 max-h-80 overflow-y-auto font-mono text-base space-y-1 text-emerald-300/90">
                                                {sm.logs.length === 0 && (
                                                    <div className="text-muted-foreground/40 animate-pulse">Waiting for response...</div>
                                                )}
                                                {sm.logs.map((line, i) => (
                                                    <div key={i} className={`leading-relaxed ${line.startsWith('❌') ? 'text-red-400'
                                                        : line.startsWith('⚠️') ? 'text-amber-400'
                                                            : line.startsWith('✅') ? 'text-emerald-400'
                                                                : 'text-emerald-300/70'
                                                        }`}>
                                                        {line}
                                                    </div>
                                                ))}
                                                {sm.isLoading && <div className="text-muted-foreground/40 animate-pulse mt-2">▌</div>}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {sm.isDone && sm.resultStats && (
                                <Card className="border-emerald-500/20 bg-emerald-500/5">
                                    <CardContent className="pt-4 space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                                            <CheckCircle2 className="h-5 w-5" />
                                            Migration Complete
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-base text-muted-foreground">
                                            <span>Content Types: <strong className="text-foreground">{sm.resultStats.contentTypes}</strong></span>
                                            <span>Entries OK: <strong className="text-foreground">{sm.resultStats.entries.success}</strong></span>
                                            <span>Assets: <strong className="text-foreground">{sm.resultStats.assets}</strong></span>
                                            {sm.resultStats.entries.failed > 0 && (
                                                <span className="text-amber-400">Failed: {sm.resultStats.entries.failed}</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {sm.status === 'error' && sm.error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-base">{sm.error}</AlertDescription>
                                </Alert>
                            )}
                        </>
                    ) : sm.diff && !sm.hasSelection ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/50 rounded-xl space-y-3">
                            <Layers className="h-10 w-10 text-muted-foreground/30" />
                            <p className="text-base text-muted-foreground">Select at least one Content Type to continue</p>
                            <Button variant="outline" size="sm" onClick={sm.selectAllChanged} className="text-base">Select all changes</Button>
                        </div>
                    ) : null
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/50 rounded-xl space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 blur-3xl bg-primary/10 rounded-full" />
                            <div className="relative h-16 w-16 rounded-2xl border border-border/50 bg-muted/30 flex items-center justify-center">
                                <GitMerge className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-base font-bold text-foreground">No diff loaded yet</p>
                            <p className="text-base text-muted-foreground">
                                Select source + target environments and click <strong>Load Live Diff</strong>
                            </p>
                        </div>
                        {sm.status === 'error' && sm.error && (
                            <Alert variant="destructive" className="text-left max-w-sm">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-base">{sm.error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </div>

            {sm.diff && (
                <LocaleRemapModal
                    open={localeRemapOpen}
                    onClose={() => setLocaleRemapOpen(false)}
                    sourceLocales={sm.diff!.sourceLocales}
                    targetLocales={sm.diff!.targetLocales.length > 0 ? sm.diff!.targetLocales : sm.diff!.sourceLocales}
                    initialMapping={sm.localeMapping}
                    onApply={sm.setLocaleMapping}
                />
            )}
        </div>
    );
}
