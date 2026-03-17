import React, { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronUp, PlusCircle, Edit3, MinusCircle, Equal,
    FileText, Calendar, Layers, ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { renderSampleFieldVal, getSystemStatus } from '@/utils/field-renderers';
import type { DiffStatus, CTDiffItem, EntryDiffItem, LocaleDiffItem } from '@/types/smart-migrate';

const DIFF_BADGE: Record<DiffStatus, { label: string; className: string; icon: React.ReactNode }> = {
    NEW: {
        label: 'NEW',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: <PlusCircle className="h-3 w-3" />,
    },
    MODIFIED: {
        label: 'MODIFIED',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: <Edit3 className="h-3 w-3" />,
    },
    DELETED: {
        label: 'DELETED',
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        icon: <MinusCircle className="h-3 w-3" />,
    },
    EQUAL: {
        label: 'EQUAL',
        className: 'bg-muted/30 text-muted-foreground border-border/50',
        icon: <Equal className="h-3 w-3" />,
    },
};

export function DiffBadge({ status }: { status: DiffStatus }) {
    const cfg = DIFF_BADGE[status];
    return (
        <Badge
            variant="outline"
            className={`h-5 px-2 text-base font-bold uppercase tracking-wider flex items-center gap-1 ${cfg.className}`}
        >
            {cfg.icon}
            {cfg.label}
        </Badge>
    );
}

export function MigrateEntryRow({
    entry,
    checked,
    onToggle,
    resolvedAssets,
    resolvedEntries,
}: {
    entry: EntryDiffItem;
    checked: boolean;
    onToggle: (id: string, checked: boolean) => void;
    resolvedAssets?: CTDiffItem['resolvedAssets'];
    resolvedEntries?: CTDiffItem['resolvedEntries'];
}) {
    const [expanded, setExpanded] = useState(false);
    const isDeleted = entry.diffStatus === 'DELETED';
    const isModified = entry.diffStatus === 'MODIFIED';

    const fields = entry.fields as Record<string, Record<string, unknown>> | undefined;
    const targetFields = entry.targetFields as Record<string, Record<string, unknown>> | undefined;

    const updatedStr = entry.sys?.updatedAt
        ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(entry.sys.updatedAt))
        : null;

    return (
        <div className={`flex flex-col rounded-lg border transition-colors overflow-hidden ${isDeleted
            ? 'border-rose-500/15 bg-rose-500/3 opacity-60'
            : checked
                ? 'border-primary/20 bg-card/40'
                : 'border-border/50 bg-card/10 hover:bg-card/30'
            }`}>
            <div className="flex items-center gap-3 p-3 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
                <Checkbox
                    id={`entry-${entry.id}`}
                    checked={checked}
                    onCheckedChange={(v) => { v !== 'indeterminate' && onToggle(entry.id, !!v); }}
                    className="shrink-0"
                    disabled={isDeleted}
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-3 w-[40%] min-w-0 pr-4">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${entry.diffStatus === 'NEW' ? 'bg-emerald-400' :
                        entry.diffStatus === 'MODIFIED' ? 'bg-amber-400' :
                            entry.diffStatus === 'DELETED' ? 'bg-rose-400' : 'bg-muted-foreground'
                        }`} />
                    <span className={`font-bold text-foreground text-base truncate ${isDeleted ? 'line-through text-muted-foreground' : ''}`}>
                        {entry.title}
                    </span>
                </div>
                <div className="flex-1 min-w-0 flex items-center text-base text-muted-foreground gap-4">
                    <DiffBadge status={entry.diffStatus} />
                    {isModified && entry.changedFieldKeys && (
                        <span className="text-base text-amber-400/80">
                            {entry.changedFieldKeys.length} field{entry.changedFieldKeys.length !== 1 ? 's' : ''} changed
                        </span>
                    )}
                    {updatedStr && (
                        <span className="truncate flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {updatedStr}
                        </span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        {getSystemStatus(entry.sys)}
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                </div>
            </div>

            {expanded && fields && (
                <div className="border-t border-border/50 bg-muted/30 p-5">
                    <div className="flex flex-col gap-6">
                        {Object.entries(fields).map(([fieldKey, fieldVal]) => {
                            const isChanged = isModified && entry.changedFieldKeys?.includes(fieldKey);
                            return (
                                <div key={fieldKey} className={`flex flex-col gap-2 p-4 rounded-lg ${isChanged ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-muted/10 border border-border/50'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-black uppercase tracking-widest text-muted-foreground/60">{fieldKey}</span>
                                        {isChanged && (
                                            <Badge variant="outline" className="h-5 px-2 text-base border-amber-500/30 text-amber-400 whitespace-nowrap">
                                                Changed
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-base">
                                        {renderSampleFieldVal(fieldVal, resolvedAssets, resolvedEntries)}
                                    </div>
                                    {isChanged && targetFields?.[fieldKey] && (
                                        <div className="text-base border-t border-amber-500/10 pt-2 mt-1 opacity-60">
                                            <span className="text-base font-bold text-rose-400/80 mb-1 block">Target (current):</span>
                                            {renderSampleFieldVal(targetFields[fieldKey], resolvedAssets, resolvedEntries)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

import type { DiffEntriesResult } from '@/hooks/useSmartMigrate';

export function MigrateCTRow({
    ct,
    checked,
    isAutoDep,
    onToggle,
    entriesData,
    isLoadingEntries,
    onLoadEntries,
    selectedEntryIds,
    onToggleEntry,
    onSelectAllEntries,
    onClearEntries,
    entrySearch,
    hideUnchanged,
}: {
    ct: CTDiffItem;
    checked: boolean;
    isAutoDep: boolean;
    onToggle: (id: string, checked: boolean) => void;
    entriesData?: DiffEntriesResult;
    isLoadingEntries: boolean;
    onLoadEntries: (ctId: string) => void;
    selectedEntryIds: Set<string>;
    onToggleEntry: (id: string, checked: boolean) => void;
    onSelectAllEntries: (ctId: string) => void;
    onClearEntries: (ctId: string) => void;
    entrySearch: string;
    hideUnchanged: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    // We fetch entries when expanded
    React.useEffect(() => {
        if (expanded && !entriesData && !isLoadingEntries && ct.diffStatus !== 'DELETED') {
            onLoadEntries(ct.id);
        }
    }, [expanded, entriesData, isLoadingEntries, ct.id, ct.diffStatus, onLoadEntries]);

    const isDeleted = ct.diffStatus === 'DELETED';
    const hasChanges = ct.diffStatus !== 'EQUAL';

    const rawEntries = useMemo(() => entriesData?.entries ?? [], [entriesData]);
    const filteredEntries = useMemo(() => {
        let list = rawEntries;
        if (hideUnchanged) {
            list = list.filter(e => e.diffStatus !== 'EQUAL');
        }
        if (entrySearch) {
            const q = entrySearch.toLowerCase();
            list = list.filter(e => e.title.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
        }
        return list;
    }, [rawEntries, entrySearch, hideUnchanged]);

    const selectedCount = rawEntries.filter(e => selectedEntryIds.has(e.id)).length;
    const newCount = rawEntries.filter(e => e.diffStatus === 'NEW').length;
    const modCount = rawEntries.filter(e => e.diffStatus === 'MODIFIED').length;
    // The diff logic previously replaced this block.

    return (
        <div className={`rounded-xl border transition-all ${isDeleted
            ? 'border-rose-500/20 bg-rose-500/5 opacity-70'
            : checked
                ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/5'
                : hasChanges
                    ? 'border-border/50 bg-muted/30 hover:bg-muted/40'
                    : 'border-border/50 bg-muted/20'
            }`}>
            <div className="flex items-center gap-4 px-4 py-4">
                <Checkbox
                    id={`ct-${ct.id}`}
                    checked={checked}
                    onCheckedChange={(v) => onToggle(ct.id, !!v)}
                    className="shrink-0 h-5 w-5"
                    disabled={isAutoDep || isDeleted}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Label
                            htmlFor={`ct-${ct.id}`}
                            className={`text-lg font-semibold cursor-pointer ${isDeleted ? 'line-through text-muted-foreground' : ''}`}
                        >
                            {ct.name}
                        </Label>
                        <span className="text-base font-mono text-muted-foreground/50">{ct.id}</span>
                        <DiffBadge status={ct.diffStatus} />
                        {isAutoDep && (
                            <Badge variant="secondary" className="h-5 px-2 text-base bg-amber-500/10 text-amber-400 border-amber-500/20">
                                auto-dep
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-base text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {ct.totalSourceEntries} source · {ct.totalTargetEntries} target
                        </span>
                        {newCount > 0 && <span className="text-emerald-400 font-semibold">+{newCount} new</span>}
                        {modCount > 0 && <span className="text-amber-400 font-semibold">~{modCount} modified</span>}
                        {ct.deletedEntryCount > 0 && <span className="text-rose-400/70">-{ct.deletedEntryCount} deleted</span>}
                        {selectedCount > 0 && <span className="text-primary font-semibold">{selectedCount} selected</span>}
                    </div>
                    {ct.changedFields && ct.changedFields.length > 0 && (
                        <p className="text-base text-amber-500/80 mt-1 font-mono">Schema: {ct.changedFields.join(', ')}</p>
                    )}
                </div>
                {!isDeleted && (
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1"
                    >
                        <Layers className="h-4 w-4" />
                        <span className="text-base font-bold">{expanded ? 'Hide entries' : 'Show entries'}</span>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                )}
            </div>

            {expanded && (
                <div className="border-t border-border/50">
                    {isLoadingEntries && !entriesData ? (
                        <div className="flex items-center justify-center p-8 text-muted-foreground text-sm gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            Loading entries...
                        </div>
                    ) : entriesData ? (
                        <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/10 text-base">
                                <button onClick={() => onSelectAllEntries(ct.id)} className="text-primary font-bold hover:underline">Select all</button>
                                <span className="text-muted-foreground/30">·</span>
                                <button onClick={() => onClearEntries(ct.id)} className="text-muted-foreground font-bold hover:underline">None</button>
                                <span className="ml-auto text-muted-foreground/60">
                                    {filteredEntries.length} entr{filteredEntries.length !== 1 ? 'ies' : 'y'}
                                </span>
                            </div>
                            <div className="px-4 pb-4 pt-2 space-y-2 max-h-[500px] overflow-y-auto">
                                {filteredEntries.map(entry => (
                                    <MigrateEntryRow
                                        key={entry.id}
                                        entry={entry}
                                        checked={selectedEntryIds.has(entry.id)}
                                        onToggle={onToggleEntry}
                                        resolvedAssets={entriesData.resolvedAssets}
                                        resolvedEntries={entriesData.resolvedEntries}
                                    />
                                ))}
                                {filteredEntries.length === 0 && (
                                    <div className="text-center text-base text-muted-foreground/40 py-4">No entries to show</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-4 text-center text-rose-400 text-sm">Failed to load entries</div>
                    )}
                </div>
            )}
        </div>
    );
}

export function MigrateLocaleRow({
    locale,
    checked,
    remappedTo,
    onToggle,
}: {
    locale: LocaleDiffItem;
    checked: boolean;
    remappedTo?: string;
    onToggle: (code: string, checked: boolean) => void;
}) {
    const isDeleted = locale.diffStatus === 'DELETED';
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${isDeleted
            ? 'border-rose-500/20 bg-rose-500/5 opacity-60'
            : checked
                ? 'border-primary/20 bg-primary/5'
                : 'border-border/50 bg-card/10 hover:bg-card/30'
            }`}>
            <Checkbox
                id={`locale-${locale.code}`}
                checked={checked}
                onCheckedChange={(v) => onToggle(locale.code, !!v)}
                disabled={isDeleted}
                className="h-5 w-5"
            />
            <div className="flex-1 min-w-0">
                <p className={`text-base font-semibold truncate ${isDeleted ? 'line-through text-muted-foreground' : ''}`}>
                    {locale.name}
                </p>
                <div className="flex items-center gap-2 text-base font-mono text-muted-foreground mt-0.5">
                    {locale.code}
                    {remappedTo && remappedTo !== locale.code && (
                        <>
                            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-primary font-bold">{remappedTo}</span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <DiffBadge status={locale.diffStatus} />
                {locale.default && (
                    <Badge variant="secondary" className="h-5 px-2 text-base">default</Badge>
                )}
            </div>
        </div>
    );
}
