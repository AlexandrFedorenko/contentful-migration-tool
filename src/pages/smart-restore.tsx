import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
    ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, Send, Download,
    FileJson, Layers, Globe, ArrowRight, Settings2, RefreshCw, Sparkles,
    ChevronDown, ChevronUp, Info, Trash2, ImageIcon, FileText, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SpaceSelector from '@/components/SpaceSelector/SpaceSelector';
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector';
import { useGlobalContext } from '@/context/GlobalContext';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useSpaces } from '@/hooks/useSpaces';
import { useSmartRestore, type CTSummary } from '@/hooks/useSmartRestore';
import { LocaleRemapModal } from '@/components/LocaleRemapModal/LocaleRemapModal';
import { PageHelp } from '@/components/PageHelp/PageHelp';
import { TabIndex } from '@/hooks/useDocumentationTabs';
import type { BackupLocale } from '@/types/backup';
import type { LocaleMapping } from '@/utils/locale-filter';

// Helpers

function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// CT Row Component

function renderSampleFieldVal(
    val: unknown,
    resolvedAssets?: Record<string, { url: string; title: string; isImage?: boolean }>,
    resolvedEntries?: Record<string, { title: string; contentType?: string }>,
    selectedLocales?: Set<string>,
    localeMapping?: LocaleMapping,
    defaultLocale: string = 'en-US'
): React.ReactNode {
    if (val === undefined || val === null) return <span className="text-muted-foreground italic">[Empty]</span>;

    // Primitive values
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        return <span className="truncate">{String(val)}</span>;
    }

    if (typeof val === 'object' && !Array.isArray(val)) {
        // Contentful localized field value, typically { 'en-US': '...', 'agq': '...' }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const localizedObj = val as Record<string, any>;
        let keys = Object.keys(localizedObj);

        // Hide locales that the user explicitly unchecked
        if (selectedLocales && selectedLocales.size > 0) {
            keys = keys.filter(k => selectedLocales.has(k));
        }

        // Sort keys so defaultLocale is first
        keys.sort((a, b) => {
            if (a === defaultLocale) return -1;
            if (b === defaultLocale) return 1;
            return a.localeCompare(b);
        });

        if (keys.length === 0) return null;

        // Render each localized value
        return (
            <div className="flex flex-col gap-3">
                {keys.map(localeKey => {
                    const mappedLocaleKey = localeMapping?.[localeKey] || localeKey;
                    const localeVal = localizedObj[localeKey];
                    return (
                        <div key={localeKey} className="flex flex-col gap-1.5 border-l-2 border-primary/20 pl-3 py-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                    {localeKey}
                                </span>
                                {mappedLocaleKey !== localeKey && (
                                    <span className="text-[9px] text-primary/70 font-mono tracking-tighter">
                                        → {mappedLocaleKey}
                                    </span>
                                )}
                            </div>
                            <div className="text-foreground/90 font-medium">
                                {renderSingleVal(localeVal, resolvedAssets, resolvedEntries)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return <span className="truncate text-muted-foreground italic">[Unknown Format]</span>;
}

// Helper to render individual actual values (primitives, arrays, links, RT)
function renderSingleVal(
    firstVal: unknown,
    resolvedAssets?: Record<string, { url: string; title: string; isImage?: boolean }>,
    resolvedEntries?: Record<string, { title: string; contentType?: string }>
): React.ReactNode {
    if (firstVal === undefined || firstVal === null) return <span className="text-muted-foreground italic">[Empty]</span>;

    // --- Handle blocks inside Arrays ---
    if (Array.isArray(firstVal)) {
        if (firstVal.length === 0) return <span className="truncate text-muted-foreground italic">[Empty]</span>;

        // Check if it's an array of links
        const firstItem = firstVal[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof firstItem === 'object' && (firstItem as any)?.sys?.type === 'Link') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const linkType = (firstItem as any).sys?.linkType;

            if (linkType === 'Asset') {
                return (
                    <div className="flex gap-2 flex-wrap mt-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {firstVal.map((item: any, i) => {
                            const id = item?.sys?.id;
                            const resolved = id ? resolvedAssets?.[id] : null;
                            if (resolved?.isImage) {
                                return (
                                    <div key={i} className="relative group rounded-lg overflow-hidden border border-border/50 bg-muted/50 h-16 w-16 shrink-0 inline-flex items-center justify-center">
                                        <Image src={resolved.url} alt={resolved.title} fill className="object-contain" unoptimized />
                                    </div>
                                );
                            } else if (resolved) {
                                return (
                                    <Badge key={i} variant="outline" className="h-6 px-2 bg-blue-500/10 border-blue-500/20 text-blue-400">
                                        <FileText className="h-3 w-3 mr-1 shrink-0" />
                                        <span className="truncate max-w-[100px]">{resolved.title}</span>
                                    </Badge>
                                );
                            }
                            return <Badge key={i} variant="outline" className="h-6 px-1.5 bg-primary/5">Asset</Badge>;
                        })}
                    </div>
                );
            } else if (linkType === 'Entry') {
                return (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {firstVal.map((item: any, i) => {
                            const id = item?.sys?.id;
                            const resolved = id ? resolvedEntries?.[id] : null;
                            return (
                                <Badge key={i} variant="outline" className="h-6 px-2 bg-indigo-500/10 border-indigo-500/20 text-indigo-300">
                                    <Layers className="h-3 w-3 mr-1 shrink-0" />
                                    <span className="truncate max-w-[150px]">{resolved?.title || `Ref: ${id?.substring(0, 6)}`}</span>
                                </Badge>
                            );
                        })}
                    </div>
                );
            }

            return (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10">
                    {firstVal.length} {linkType}{firstVal.length > 1 ? 's' : ''}
                </Badge>
            );
        }

        // It's an array of primitives (like symbols)
        return <span className="truncate">{firstVal.join(', ')}</span>;
    }

    // --- Single Link (Asset or Entry) ---
    if (typeof firstVal === 'object' && firstVal !== null) {
        const linkObj = firstVal as { sys?: { type: string, linkType: string, id: string } };
        if (linkObj.sys?.type === 'Link') {
            if (linkObj.sys.linkType === 'Asset') {
                const id = linkObj.sys.id;
                const resolved = resolvedAssets?.[id];
                if (resolved) {
                    if (resolved.isImage) {
                        return (
                            <div className="flex flex-col gap-2 mt-2 mb-2 w-full">
                                <Image src={resolved.url} alt={resolved.title} width={400} height={128} className="h-32 w-auto max-w-md object-contain rounded-lg bg-muted/50 border border-border/50" unoptimized />
                                {resolved.title !== 'Asset' && <span className="truncate text-xs text-foreground/50 px-1">{resolved.title}</span>}
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center gap-1.5 text-sm text-blue-400 mt-1">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate font-medium">{resolved.title}</span>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                        <ImageIcon className="h-3 w-3 shrink-0" />
                        <span className="truncate">Image / File (Asset)</span>
                    </div>
                );
            } else if (linkObj.sys.linkType === 'Entry') {
                const id = linkObj.sys.id;
                const resolved = resolvedEntries?.[id];
                return (
                    <Badge variant="outline" className="h-6 px-2 mt-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-300 inline-flex items-center">
                        <Layers className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate max-w-[200px]">{resolved?.title || `Ref: ${id.substring(0, 6)}`}</span>
                    </Badge>
                );
            }
            return <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10">Ref: {linkObj.sys.id.substring(0, 6)}</Badge>;
        }

        // --- Rich Text ---
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rtObj = firstVal as { nodeType?: string, content?: any[] };
        if (rtObj.nodeType === 'document' && Array.isArray(rtObj.content)) {
            let extractedText = '';
            let embeddedAssets = 0;
            let embeddedEntries = 0;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const extractRichText = (nodes: any[]) => {
                for (const node of nodes) {
                    if (node.nodeType === 'text' && node.value) {
                        extractedText += node.value + ' ';
                    } else if (node.nodeType?.includes('embedded-asset')) {
                        embeddedAssets++;
                    } else if (node.nodeType?.includes('embedded-entry') || node.nodeType?.includes('entry-hyperlink')) {
                        embeddedEntries++;
                    }

                    if (node.content && Array.isArray(node.content)) {
                        extractRichText(node.content);
                    }
                }
            };
            extractRichText(rtObj.content);

            extractedText = extractedText.trim();

            return (
                <div className="flex flex-col gap-2">
                    {extractedText ? (
                        <div className="flex items-start gap-2 pt-1">
                            <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" />
                            <span className="line-clamp-2 max-w-[500px] text-sm leading-relaxed text-foreground/90">{extractedText}</span>
                        </div>
                    ) : (
                        <span className="truncate text-muted-foreground italic pt-1">[Rich Text]</span>
                    )}
                    {(embeddedAssets > 0 || embeddedEntries > 0) && (
                        <div className="flex gap-2">
                            {embeddedAssets > 0 && (
                                <Badge variant="secondary" className="bg-muted/50 text-[10px] text-primary border-border/50 h-5">
                                    + {embeddedAssets} Asset{embeddedAssets > 1 ? 's' : ''}
                                </Badge>
                            )}
                            {embeddedEntries > 0 && (
                                <Badge variant="secondary" className="bg-muted/50 text-[10px] text-indigo-400 border-border/50 h-5">
                                    + {embeddedEntries} Ref{embeddedEntries > 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            );
        }
    }

    if (typeof firstVal === 'string' || typeof firstVal === 'number' || typeof firstVal === 'boolean') {
        return <span className="truncate">{String(firstVal)}</span>;
    }

    return <span className="truncate text-muted-foreground italic">[Complex Object]</span>;
}

function getSystemStatus(sys?: { version: number; publishedVersion?: number }) {
    if (!sys) return null;
    if (!sys.publishedVersion) {
        return <Badge variant="outline" className="h-5 px-2 text-[10px] border-amber-500/30 text-amber-500/90 whitespace-nowrap">Draft</Badge>;
    }
    if (sys.version > sys.publishedVersion + 1) {
        return <Badge variant="outline" className="h-5 px-2 text-[10px] border-blue-500/30 text-blue-400 whitespace-nowrap">Changed</Badge>;
    }
    return <Badge variant="outline" className="h-5 px-2 text-[10px] border-emerald-500/30 text-emerald-500/90 whitespace-nowrap">Published</Badge>;
}

function EntryRow({
    e,
    ct,
    selectedLocales,
    localeMapping,
    defaultLocale
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e: any;
    ct: CTSummary;
    selectedLocales: Set<string>;
    localeMapping: LocaleMapping;
    defaultLocale: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const fieldKeys = Object.keys(e.fields);
    const displayFieldValue = ct.displayField ? e.fields[ct.displayField] : null;

    let titleStr = e.id;
    if (displayFieldValue && typeof displayFieldValue === 'object') {
        if (defaultLocale && defaultLocale in displayFieldValue) {
            const val = displayFieldValue[defaultLocale];
            if (typeof val === 'string' || typeof val === 'number') {
                titleStr = String(val);
            }
        } else {
            const firstVal = Object.values(displayFieldValue)[0];
            if (typeof firstVal === 'string' || typeof firstVal === 'number') {
                titleStr = String(firstVal);
            }
        }
    } else if (typeof displayFieldValue === 'string' || typeof displayFieldValue === 'number') {
        titleStr = String(displayFieldValue);
    }

    const updatedStr = e.sys?.updatedAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(e.sys.updatedAt)) : 'Unknown';

    return (
        <div className="flex flex-col rounded-lg border border-border/50 bg-card hover:bg-card/80 transition-colors overflow-hidden">
            <div
                className="flex items-center gap-4 p-3 cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3 w-[40%] min-w-0 pr-4">
                    <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-bold text-foreground text-sm truncate">{titleStr}</span>
                </div>
                <div className="flex-1 min-w-0 flex items-center text-[13px] text-muted-foreground gap-4">
                    <div className="w-1/3 truncate">{ct.name}</div>
                    <div className="w-1/3 truncate">{updatedStr}</div>
                    <div className="w-1/3 flex justify-end">{getSystemStatus(e.sys)}</div>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-border/50 bg-muted/30 p-5">
                    <div className="flex flex-col gap-6">
                        {fieldKeys.map(k => {
                            const fieldVal = e.fields[k];
                            // Determine if this field has any selected locales
                            let hasValidLocale = true;
                            if (typeof fieldVal === 'object' && fieldVal !== null && !Array.isArray(fieldVal)) {
                                const availableLocales = Object.keys(fieldVal);
                                if (selectedLocales && selectedLocales.size > 0) {
                                    hasValidLocale = availableLocales.some(loc => selectedLocales.has(loc));
                                }
                            }
                            if (!hasValidLocale) return null;

                            return (
                                <div key={k} className="flex flex-col gap-2 p-4 rounded-lg bg-muted/20 border border-border/50">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{k}</span>
                                    <div className="text-sm">
                                        {renderSampleFieldVal(fieldVal, ct.resolvedAssets, ct.resolvedEntries, selectedLocales, localeMapping, defaultLocale)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function CTRow({
    ct,
    checked,
    isAutoDep,
    onToggle,
    selectedLocales,
    localeMapping,
    defaultLocale
}: {
    ct: CTSummary;
    checked: boolean;
    isAutoDep: boolean;
    onToggle: (id: string, checked: boolean) => void;
    selectedLocales: Set<string>;
    localeMapping: LocaleMapping;
    defaultLocale: string;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`rounded-xl border transition-all ${checked ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/5' : 'border-border/50 bg-muted/30 hover:bg-muted/40'}`}>
            <div className="flex items-center gap-4 px-4 py-4">
                <Checkbox
                    id={`ct-${ct.id}`}
                    checked={checked}
                    onCheckedChange={(v) => onToggle(ct.id, !!v)}
                    className="shrink-0 h-5 w-5"
                    disabled={isAutoDep}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Label
                            htmlFor={`ct-${ct.id}`}
                            className="text-lg font-bold cursor-pointer text-foreground"
                        >
                            {ct.name}
                        </Label>
                        <span className="text-sm font-mono text-muted-foreground/70 bg-muted/40 px-2 py-0.5 rounded-md">{ct.id}</span>
                        {isAutoDep && (
                            <Badge variant="secondary" className="text-xs h-6 px-3 bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold">
                                auto-dep
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                        <span className="font-semibold text-foreground/80">{ct.totalEntries} entries</span>
                        {(!expanded && ct.sampleTitles.length > 0) && (
                            <>
                                <span className="text-border/50">•</span>
                                <span className="truncate opacity-80">{ct.sampleTitles.slice(0, 2).join(', ')}{ct.sampleTitles.length > 2 ? '...' : ''}</span>
                            </>
                        )}
                    </p>
                </div>
                {(ct.sampleTitles.length > 0) && (
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-2 bg-muted/40 rounded-lg hover:bg-muted/50"
                    >
                        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                )}
            </div>
            {expanded && (ct.sampleEntries?.length ? ct.sampleEntries.length > 0 : ct.sampleTitles.length > 0) && (
                <div className="px-5 pb-5 pt-3">
                    <div className="space-y-2 bg-muted/50 rounded-lg py-3 px-2 border border-border/50">
                        {/* List Header */}
                        {ct.sampleEntries && ct.sampleEntries.length > 0 && (
                            <div className="flex items-center gap-4 px-4 pb-2 border-b border-border/50 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                <div className="w-[40%]">Name</div>
                                <div className="flex-1 flex gap-4">
                                    <div className="w-1/3">Content Type</div>
                                    <div className="w-1/3">Updated</div>
                                    <div className="w-1/3 text-right">Status</div>
                                </div>
                            </div>
                        )}

                        {/* Render rich entries if available from new API, else fallback to just titles */}
                        <div className="space-y-1.5 pt-1">
                            {ct.sampleEntries ? (
                                ct.sampleEntries.map((e) => (
                                    <EntryRow
                                        key={e.id}
                                        e={e}
                                        ct={ct}
                                        selectedLocales={selectedLocales}
                                        localeMapping={localeMapping}
                                        defaultLocale={defaultLocale}
                                    />
                                ))
                            ) : (
                                <div className="space-y-1.5 px-3">
                                    {ct.sampleTitles.map((t, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                                            <span className="truncate font-medium">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// SmartRestore Page Component

export default function SmartRestorePage() {
    const router = useRouter();
    const { state } = useGlobalContext();
    const { loadEnvironments } = useEnvironments();
    const { spaces } = useSpaces();

    const sr = useSmartRestore();

    // Target env
    const [targetEnvList, setTargetEnvList] = useState<{ id: string; name: string }[]>([]);

    // Locale remap modal
    const [localeRemapOpen, setLocaleRemapOpen] = useState(false);

    // Search query for content types
    const [ctSearchQuery, setCtSearchQuery] = useState('');

    // Export result caching
    const [exportResult, setExportResult] = useState<{
        exportData: unknown;
        stats: { contentTypes: number; entries: number; assets: number; locales: number };
        assetFileUrls: Array<{ id: string; url: string; fileName: string }>;
    } | null>(null);

    // Sync source space from global state
    useEffect(() => {
        if (state.spaceId) {
            sr.setSourceSpaceId(state.spaceId);
            loadEnvironments(state.spaceId);
        }
    }, [state.spaceId, loadEnvironments]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (state.spaceId) {
            sr.setTargetSpaceId(state.spaceId);
        }
    }, [state.spaceId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load source envs
    useEffect(() => {
        if (state.spaceId) loadEnvironments(state.spaceId);
    }, [state.spaceId, loadEnvironments]);

    // Load target envs when target space changes
    useEffect(() => {
        if (!sr.targetSpaceId) return;
        fetch(`/api/environments?spaceId=${sr.targetSpaceId}`)
            .then(r => r.json())
            .then(j => setTargetEnvList(j.data?.environments ?? []))
            .catch(() => { });
    }, [sr.targetSpaceId]);

    // Load target locales when target env changes
    useEffect(() => {
        if (sr.targetSpaceId && sr.targetEnvironmentId) {
            sr.loadTargetLocales(sr.targetSpaceId, sr.targetEnvironmentId);
        }
    }, [sr.targetSpaceId, sr.targetEnvironmentId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLoadPreview = () => {
        if (sr.sourceSpaceId && sr.sourceEnvironmentId) {
            sr.loadPreview(sr.sourceSpaceId, sr.sourceEnvironmentId);
        }
    };

    const handleTransfer = async () => {
        await sr.executeTransfer();
    };

    const handleExport = async () => {
        const result = await sr.executeExport();
        if (result) {
            setExportResult(result as typeof exportResult);
        }
    };

    const handleDownloadJson = () => {
        if (!exportResult) return;
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        downloadJson(exportResult.exportData, `smart-export-${ts}.json`);
    };

    const statsBar = sr.preview ? {
        cts: sr.selectedCTIds.size,
        locales: sr.selectedLocales.size || sr.preview.locales.length,
    } : null;

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
                            <Sparkles className="h-7 w-7 text-primary" />
                            Smart Restore
                        </h1>
                        <PageHelp
                            description="Selective content transfer between target environments and spaces via live Content Management API data."
                            docTab={TabIndex.SMART_RESTORE}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Selective content transfer between environments and spaces via live CMA data
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Phase 1: Source */}
                <div className="w-full">
                    <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Eye className="h-4 w-4 text-primary" />
                                Source Environment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <SpaceSelector />
                            {state.spaceId && (
                                <EnvironmentSelector
                                    environments={state.donorEnvironments ?? []}
                                    value={sr.sourceEnvironmentId}
                                    onChange={(v) => sr.setSourceEnvironmentId(v)}
                                    label="Source Environment"
                                />
                            )}
                            {state.spaceId && sr.sourceEnvironmentId && (
                                <Button
                                    onClick={handleLoadPreview}
                                    disabled={sr.isLoading}
                                    className="w-full bg-primary/90 hover:bg-primary font-bold"
                                >
                                    {sr.status === 'loading-preview' ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading live data...</>
                                    ) : (
                                        <><RefreshCw className="mr-2 h-4 w-4" />Load Preview</>
                                    )}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Phase 2: Preview & Selection */}
                <div className="w-full">
                    {sr.preview && (
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                        <Layers className="h-4 w-4 text-emerald-400" />
                                        Content Selection
                                    </CardTitle>
                                    {statsBar && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="font-bold text-primary">{statsBar.cts}</span> CTs ·{' '}
                                            <span className="font-bold text-primary">{statsBar.locales}</span> locales
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex flex-col gap-6">

                                    {/* Locales (Moved to top) */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                                Locales
                                            </Label>
                                            <button
                                                onClick={() => setLocaleRemapOpen(true)}
                                                className="flex items-center gap-1.5 text-sm text-primary font-bold hover:underline"
                                            >
                                                <Settings2 className="h-4 w-4" />
                                                Remap
                                            </button>
                                        </div>

                                        {/* Locale mapping summary if any */}
                                        {Object.keys(sr.localeMapping).length > 0 && (
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm text-primary font-bold">
                                                <Globe className="h-4 w-4 shrink-0" />
                                                {Object.entries(sr.localeMapping).map(([src, tgt]) => `${src}→${tgt}`).join(', ')}
                                            </div>
                                        )}

                                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                            {sr.preview.locales.map((locale: BackupLocale) => {
                                                const targetCode = sr.localeMapping[locale.code] ?? locale.code;
                                                const hasRemap = targetCode !== locale.code;
                                                return (
                                                    <div
                                                        key={locale.code}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${sr.selectedLocales.has(locale.code) || sr.selectedLocales.size === 0
                                                            ? 'border-primary/20 bg-primary/5'
                                                            : 'border-border/50 bg-muted/20'
                                                            }`}
                                                    >
                                                        <Checkbox
                                                            id={`locale-${locale.code}`}
                                                            checked={sr.selectedLocales.size === 0 || sr.selectedLocales.has(locale.code)}
                                                            onCheckedChange={(v) => sr.toggleLocale(locale.code, !!v)}
                                                            className="h-5 w-5"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-base font-semibold truncate">{locale.name}</p>
                                                            <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground mt-0.5">
                                                                {locale.code}
                                                                {hasRemap && (
                                                                    <>
                                                                        <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                                                                        <span className="text-primary font-bold">{targetCode}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {locale.default && (
                                                            <Badge variant="secondary" className="text-xs h-5 px-2 shrink-0">def</Badge>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-sm text-muted-foreground/60 italic">
                                            Unchecked = all locales included
                                        </p>
                                    </div>

                                    {/* Content Types (Moved below Locales) */}
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground shrink-0">
                                                Content Types
                                            </Label>

                                            <div className="flex items-center gap-4 flex-1 sm:justify-end">
                                                <div className="relative w-full sm:max-w-xs">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search by name or ID..."
                                                        className="pl-9 h-8 bg-muted/30 border-border/50 text-sm"
                                                        value={ctSearchQuery}
                                                        onChange={(e) => setCtSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex gap-3 shrink-0">
                                                    <button
                                                        onClick={sr.selectAllCTs}
                                                        className="text-sm text-primary font-bold hover:underline"
                                                    >
                                                        All
                                                    </button>
                                                    <span className="text-muted-foreground text-sm">·</span>
                                                    <button
                                                        onClick={sr.clearAllCTs}
                                                        className="text-sm text-muted-foreground font-bold hover:underline"
                                                    >
                                                        None
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                                            {sr.preview.contentTypes
                                                .filter(ct =>
                                                    ctSearchQuery.trim() === '' ||
                                                    ct.name.toLowerCase().includes(ctSearchQuery.toLowerCase()) ||
                                                    ct.id.toLowerCase().includes(ctSearchQuery.toLowerCase())
                                                )
                                                .map((ct) => (
                                                    <CTRow
                                                        key={ct.id}
                                                        ct={ct}
                                                        checked={sr.selectedCTIds.has(ct.id)}
                                                        isAutoDep={sr.autoDeps.has(ct.id) && !sr.selectedCTIds.has(ct.id)}
                                                        onToggle={sr.toggleCT}
                                                        selectedLocales={sr.selectedLocales}
                                                        localeMapping={sr.localeMapping}
                                                        defaultLocale={sr.preview?.locales.find(l => l.default)?.code || 'en-US'}
                                                    />
                                                ))}
                                        </div>
                                    </div>

                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Phase 3: Action */}
                {sr.preview && sr.hasSelection && (
                    <div className="w-full space-y-6">
                        {/* Mode toggle */}
                        <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4 border-b border-white/5">
                                <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                                    <Send className="h-6 w-6 text-primary" />
                                    Action
                                </CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Choose how to use the selected content.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <Tabs value={sr.actionMode} onValueChange={(v) => sr.setActionMode(v as 'transfer' | 'export')}>
                                    <TabsList className="grid grid-cols-2 w-full h-14">
                                        <TabsTrigger value="transfer" className="text-base font-bold uppercase tracking-wider">
                                            Live Transfer
                                        </TabsTrigger>
                                        <TabsTrigger value="export" className="text-base font-bold uppercase tracking-wider">
                                            Export JSON
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Transfer mode */}
                                {sr.actionMode === 'transfer' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <span className="text-sm font-semibold text-muted-foreground block">Target Space</span>
                                                <Select
                                                    value={sr.targetSpaceId || ''}
                                                    onValueChange={(val) => {
                                                        sr.setTargetSpaceId(val);
                                                        sr.setTargetEnvironmentId('');
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background/50 text-left items-center">
                                                        <SelectValue placeholder="Select target space..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {spaces.map((s) => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                {s.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {sr.targetSpaceId && (
                                                <EnvironmentSelector
                                                    environments={targetEnvList}
                                                    value={sr.targetEnvironmentId}
                                                    onChange={sr.setTargetEnvironmentId}
                                                    label="Target Environment"
                                                />
                                            )}
                                        </div>

                                        <Separator className="bg-white/5" />

                                        <div className="space-y-4">
                                            <Label className="text-base font-black uppercase tracking-widest text-muted-foreground block mb-3">
                                                Options
                                            </Label>

                                            <div className="flex items-start gap-3 px-3 py-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                                <Checkbox
                                                    id="clear-env"
                                                    checked={sr.options.clearEnvironment}
                                                    onCheckedChange={(v) => sr.setOptions(o => ({ ...o, clearEnvironment: !!v }))}
                                                    className="mt-1 h-5 w-5 border-amber-500/50 data-[state=checked]:bg-amber-500"
                                                />
                                                <div className="flex flex-col gap-1">
                                                    <Label htmlFor="clear-env" className="text-base font-bold text-amber-500 cursor-pointer flex items-center">
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Clear target before transfer
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">Remove all entries, assets and CTs from target env first</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 px-3 py-4 rounded-xl bg-white/3 border border-white/5">
                                                <Checkbox
                                                    id="include-assets"
                                                    checked={sr.options.includeAssets}
                                                    onCheckedChange={(v) => sr.setOptions(o => ({ ...o, includeAssets: !!v }))}
                                                    className="mt-1 h-5 w-5"
                                                />
                                                <div className="flex flex-col gap-1">
                                                    <Label htmlFor="include-assets" className="text-base font-bold cursor-pointer">
                                                        Include assets
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">Transfer asset metadata to target via CMA</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleTransfer}
                                            disabled={!sr.targetSpaceId || !sr.targetEnvironmentId || sr.isLoading}
                                            className="w-full h-14 text-lg font-extrabold bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90"
                                        >
                                            {sr.isLoading ? (
                                                <><Loader2 className="mr-3 h-5 w-5 animate-spin" />Transferring...</>
                                            ) : (
                                                <><Send className="mr-3 h-5 w-5" />Execute Transfer</>
                                            )}
                                        </Button>

                                        {/* Safety backup info */}
                                        {!sr.isLoading && !sr.isDone && (
                                            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-base text-amber-400">
                                                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                                                <span>A safety backup of the target env will be created automatically before any write.</span>
                                            </div>
                                        )}

                                        {/* Live log console */}
                                        {(sr.isLoading || sr.logs.length > 0) && (
                                            <div className="rounded-xl border border-white/5 bg-black/30 overflow-hidden mt-6">
                                                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-white/3">
                                                    <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                                        Transfer Log
                                                    </span>
                                                    <span className="ml-auto text-sm text-muted-foreground/50 font-mono">
                                                        {sr.logs.length} lines
                                                    </span>
                                                </div>
                                                <div className="p-5 max-h-80 overflow-y-auto font-mono text-base space-y-1 text-emerald-300/90">
                                                    {sr.logs.length === 0 && (
                                                        <div className="text-muted-foreground/40 animate-pulse">Waiting for response...</div>
                                                    )}
                                                    {sr.logs.map((line, i) => (
                                                        <div key={i} className={`leading-relaxed ${line.startsWith('❌') ? 'text-red-400' : line.startsWith('⚠️') ? 'text-amber-400' : line.startsWith('✅') ? 'text-emerald-400' : 'text-emerald-300/70'}`}>
                                                            {line}
                                                        </div>
                                                    ))}
                                                    {sr.isLoading && (
                                                        <div className="text-muted-foreground/40 animate-pulse mt-2">▌</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Export mode */}
                                {sr.actionMode === 'export' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-start gap-3 px-3 py-4 rounded-xl bg-white/3 border border-white/5">
                                            <Checkbox
                                                id="export-assets"
                                                checked={sr.options.includeAssets}
                                                onCheckedChange={(v) => sr.setOptions(o => ({ ...o, includeAssets: !!v }))}
                                                className="mt-1 h-5 w-5"
                                            />
                                            <div className="flex flex-col gap-1">
                                                <Label htmlFor="export-assets" className="text-base font-bold cursor-pointer">
                                                    Include asset metadata
                                                </Label>
                                                <p className="text-sm text-muted-foreground">Export asset fields alongside entries</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
                                            <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                            <span>Exported JSON can be restored on any Contentful account via the Restore page.</span>
                                        </div>

                                        {!exportResult ? (
                                            <Button
                                                onClick={handleExport}
                                                disabled={sr.isLoading}
                                                className="w-full h-12 font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90"
                                            >
                                                {sr.isLoading ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Building export...</>
                                                ) : (
                                                    <><FileJson className="mr-2 h-4 w-4" />Build Export</>
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="space-y-2 animate-in fade-in duration-300">
                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                                    <span>CTs: <strong className="text-foreground">{exportResult.stats.contentTypes}</strong></span>
                                                    <span>Entries: <strong className="text-foreground">{exportResult.stats.entries}</strong></span>
                                                    <span>Assets: <strong className="text-foreground">{exportResult.stats.assets}</strong></span>
                                                    <span>Locales: <strong className="text-foreground">{exportResult.stats.locales}</strong></span>
                                                </div>
                                                <Button
                                                    onClick={handleDownloadJson}
                                                    className="w-full font-bold bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download JSON
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleExport}
                                                    className="w-full text-xs"
                                                >
                                                    <RefreshCw className="mr-2 h-3 w-3" />
                                                    Rebuild
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Result card */}
                        {sr.isDone && sr.resultStats && sr.actionMode === 'transfer' && (
                            <Card className="border-emerald-500/20 bg-emerald-500/5">
                                <CardContent className="pt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Transfer Complete
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <span>Content Types: <strong className="text-foreground">{sr.resultStats.contentTypes}</strong></span>
                                        <span>Entries OK: <strong className="text-foreground">{sr.resultStats.entries.success}</strong></span>
                                        {sr.resultStats.entries.failed > 0 && (
                                            <span className="col-span-2 text-amber-400">
                                                Failed: {sr.resultStats.entries.failed}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {sr.status === 'error' && sr.error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{sr.error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </div>

            {/* Prompt to select CTs */}
            {sr.preview && !sr.hasSelection && (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-xl space-y-3">
                    <Layers className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                        Select at least one Content Type to continue
                    </p>
                </div>
            )}

            {/* Prompt to load preview */}
            {!sr.preview && sr.status !== 'loading-preview' && (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-xl space-y-3">
                    <Eye className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                        Select a source environment and click <strong>Load Preview</strong> to see live data
                    </p>
                </div>
            )}

            {/* Locale Remap Modal */}
            {sr.preview && (
                <LocaleRemapModal
                    open={localeRemapOpen}
                    onClose={() => setLocaleRemapOpen(false)}
                    sourceLocales={sr.preview.locales}
                    targetLocales={sr.targetLocales.length > 0 ? sr.targetLocales : sr.preview.locales}
                    initialMapping={sr.localeMapping}
                    onApply={sr.setLocaleMapping}
                />
            )}
        </div>
    );
}
