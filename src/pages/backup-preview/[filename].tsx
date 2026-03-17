/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    LayoutDashboard,
    FileText,
    Code,
    Search,
    ArrowLeft,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Database,
    Layers,
    Image as ImageIcon,
    Globe,

} from "lucide-react";
import { useGlobalContext } from '@/context/GlobalContext';
import { useRestore } from '@/hooks/useRestore';
import { Backup, BackupData, BackupEntry, BackupAsset, BackupContentType, BackupLocale } from '@/types/backup';
import { cn } from "@/lib/utils";
import { api } from '@/utils/api';
import { parseError, instructionToString } from '@/utils/errorParser';

interface RichTextNode {
    nodeType: string;
    value?: string;
    marks?: { type: string }[];
    content?: RichTextNode[];
    data?: {
        target?: {
            sys?: {
                id?: string;
            }
        }
    };
}

// Helper to get title from an entry. Prefer the content type's "displayField" when provided.
const getEntryTitle = (entry: BackupEntry, contentTypes?: BackupContentType[]) => {
    if (!entry || !entry.fields) return entry?.sys?.id || 'Unknown';
    const fields = entry.fields;

    // 0. If we have contentTypes metadata, try to use the configured displayField
    if (contentTypes && contentTypes.length > 0) {
        const ct = contentTypes.find(c => c.sys?.id === entry.sys.contentType?.sys?.id);
        const display = ct?.displayField;
        if (display) {
            const val = (fields as Record<string, unknown>)[display];
            if (val) {
                if (typeof val === 'object' && val !== null) return Object.values(val)[0] as string;
                return String(val);
            }
        }
    }

    // 1. Heuristic search for common title-like fields
    const titleField = Object.keys(fields).find(key => {
        const k = key.toLowerCase();
        return k.includes('title') || k.includes('name') || k.includes('label') || k.includes('headline') || k.includes('slug') || k.includes('header');
    });

    if (titleField) {
        const val = fields[titleField];
        if (typeof val === 'object' && val !== null) {
            return Object.values(val)[0] as string;
        }
        return String(val);
    }

    // 2. Fallback to first available string-like field
    for (const key of Object.keys(fields)) {
        const val = fields[key];
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val !== null) {
            const firstVal = Object.values(val)[0];
            if (typeof firstVal === 'string') return firstVal;
        }
    }

    return entry.sys.id;
};

const RichTextRenderer = ({ node, assets, entries, contentTypes }: { node: RichTextNode, assets: BackupAsset[], entries: BackupEntry[], contentTypes?: BackupContentType[] }) => {
    if (node.nodeType === 'text') {
        const classes = cn(
            "text-base",
            node.marks?.some((m) => m.type === 'bold') && "font-bold",
            node.marks?.some((m) => m.type === 'italic') && "italic",
            node.marks?.some((m) => m.type === 'underline') && "underline"
        );
        return <span className={classes}>{node.value}</span>;
    }

    if (node.nodeType === 'paragraph') {
        return (
            <p className="mb-4 leading-relaxed text-base text-muted-foreground/90">
                {node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} contentTypes={contentTypes} />)}
            </p>
        );
    }

    if (node.nodeType === 'heading-1') return <h1 className="text-3xl font-bold mb-4 mt-6">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} contentTypes={contentTypes} />)}</h1>;
    if (node.nodeType === 'heading-2') return <h2 className="text-2xl font-bold mb-3 mt-5">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} contentTypes={contentTypes} />)}</h2>;
    if (node.nodeType === 'heading-3') return <h3 className="text-xl font-bold mb-2 mt-4">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} contentTypes={contentTypes} />)}</h3>;

    if (node.nodeType === 'embedded-asset-block') {
        const assetId = node.data?.target?.sys?.id;
        const asset = assets?.find(a => a.sys.id === assetId);
        if (asset) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fileData = Object.values(asset.fields?.file || {})[0] as any;
            if (fileData?.url && fileData.contentType?.startsWith('image/')) {
                return (
                    <div className="my-4 relative w-full h-64 bg-muted/30 rounded-lg overflow-hidden border border-border/50">
                        <Image
                            src={fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url}
                            alt={fileData.fileName || 'Asset Image'}
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                );
            }
            return (
                <div className="my-4 p-3 rounded-xl bg-muted/20 dark:bg-white/5 text-xs flex items-center gap-3 border border-dashed border-border/50 max-w-sm">
                    <FileText className="h-5 w-5 text-muted-foreground/50" />
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="font-bold text-foreground truncate">{fileData?.fileName || 'Attachment'}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{fileData?.contentType || 'Unknown Type'}</span>
                    </div>
                    {fileData?.details?.size && (
                        <Badge variant="outline" className="text-[9px] bg-muted/50 border-border/50 shrink-0">
                            {(fileData.details.size / 1024).toFixed(1)} KB
                        </Badge>
                    )}
                </div>
            );
        }
        return (
            <div className="my-4 p-2 rounded-lg bg-muted/20 text-xs flex items-center gap-2 border border-dashed border-border/50 max-w-sm">
                <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                <span className="font-medium text-muted-foreground">Asset ID: <span className="font-mono opacity-70">{assetId}</span></span>
                <Badge variant="outline" className="text-[9px] ml-auto border-dashed opacity-50">Attachment</Badge>
            </div>
        );
    }

    if (node.nodeType === 'embedded-entry-block' || node.nodeType === 'embedded-entry-inline') {
        const entryId = node.data?.target?.sys?.id;
        const entry = entries?.find(e => e.sys.id === entryId);
        const title = entry ? getEntryTitle(entry, contentTypes) : entryId;
        const label = title === entryId ? `ID: ${entryId}` : `${title} (ID: ${entryId})`;
        return <Badge variant="outline" className="my-1 mr-1 text-xs">{label}</Badge>;
    }

    if (node.nodeType === 'unordered-list') return <ul className="list-disc pl-5 mb-4 space-y-1">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} contentTypes={contentTypes} />)}</ul>;
    if (node.nodeType === 'ordered-list') return <ol className="list-decimal pl-5 mb-4 space-y-1">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} contentTypes={contentTypes} />)}</ol>;
    if (node.nodeType === 'list-item') return <li className="text-base text-muted-foreground">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} contentTypes={contentTypes} />)}</li>;

    return (
        <div className="pl-2 border-l-2 border-primary/20">
            {node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} contentTypes={contentTypes} />)}
        </div>
    );
};

export default function BackupPreview() {
    const router = useRouter();
    const { filename } = router.query;
    const { dispatch } = useGlobalContext();
    const { handleRestore } = useRestore();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [backupData, setBackupData] = useState<BackupData | null>(null);
    const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedLocales, setSelectedLocales] = useState<Set<string>>(new Set());
    const [selectedContentTypes, setSelectedContentTypes] = useState<Set<string>>(new Set());
    const [isRestoring, setIsRestoring] = useState(false);

    const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
    const [clearEnvironment, setClearEnvironment] = useState(false);
    const [restoreError, setRestoreError] = useState<string | null>(null);

    useEffect(() => {
        if (!router.isReady) return;

        const fetchBackupContent = async () => {
            try {
                const spaceId = new URLSearchParams(window.location.search).get('spaceId');
                if (!spaceId || !filename) throw new Error('Missing spaceId or filename');

                let data;
                if (typeof filename === 'string' && filename.startsWith('temp-preview-')) {
                    const storageKey = `temp-backup-${spaceId}-${filename}`;
                    const { getTempBackup } = await import('@/utils/largeFileStorage');
                    const fileContent = await getTempBackup(storageKey);
                    if (!fileContent) throw new Error('Temporary backup file not found or expired');
                    data = JSON.parse(fileContent);
                } else {
                    const result = await api.get<any>(`/api/backup-content?spaceId=${spaceId}&filename=${filename}`);
                    if (result.success && result.data) {
                        data = result.data;
                    } else {
                        throw new Error(result.error || 'Failed to load backup content');
                    }
                }

                setBackupData(data);

                if (data.contentTypes && data.contentTypes.length > 0) {
                    setSelectedContentType(data.contentTypes[0].sys.id);
                }

                const storageKey = `backup-selection-${spaceId}-${filename}`;
                const savedSelection = localStorage.getItem(storageKey);

                if (savedSelection) {
                    try {
                        const parsed = JSON.parse(savedSelection);
                        setSelectedLocales(new Set(parsed.locales || []));
                        setSelectedContentTypes(new Set(parsed.contentTypes || []));
                    } catch {
                        setSelectedLocales(new Set(data.locales?.map((l: BackupLocale) => l.code) || []));
                        setSelectedContentTypes(new Set(data.contentTypes?.map((ct: BackupContentType) => ct.sys.id) || []));
                    }
                } else {
                    setSelectedLocales(new Set(data.locales?.map((l: BackupLocale) => l.code) || []));
                    setSelectedContentTypes(new Set(data.contentTypes?.map((ct: BackupContentType) => ct.sys.id) || []));
                }
            } catch (err) {
                const instruction = parseError(err instanceof Error ? err.message : 'Unknown error');
                setError(instructionToString(instruction));
            } finally {
                setLoading(false);
            }
        };

        fetchBackupContent();
    }, [router.isReady, filename]);

    const stats = useMemo(() => {
        if (!backupData) return null;
        return {
            contentTypes: backupData.contentTypes?.length || 0,
            entries: backupData.entries?.length || 0,
            assets: backupData.assets?.length || 0,
            locales: backupData.locales?.length || 0,
        };
    }, [backupData]);

    const entriesByContentType = useMemo(() => {
        if (!backupData?.entries) return {};
        const grouped: Record<string, BackupEntry[]> = {};
        backupData.entries.forEach((entry: BackupEntry) => {
            const ctId = entry.sys.contentType.sys.id;
            if (!grouped[ctId]) grouped[ctId] = [];
            grouped[ctId].push(entry);
        });
        return grouped;
    }, [backupData]);

    const filteredEntries = useMemo(() => {
        if (!selectedContentType || !entriesByContentType[selectedContentType]) return [];
        return entriesByContentType[selectedContentType];
    }, [selectedContentType, entriesByContentType]);

    const filteredContentTypes = useMemo(() => {
        if (!backupData?.contentTypes) return [];
        if (!searchTerm) return backupData.contentTypes;
        const lowerSearch = searchTerm.toLowerCase();
        return backupData.contentTypes.filter((ct: BackupContentType) =>
            (ct.name as string).toLowerCase().includes(lowerSearch) ||
            ct.sys.id.toLowerCase().includes(lowerSearch)
        );
    }, [backupData, searchTerm]);

    const handleLocaleToggle = (localeCode: string) => {
        setSelectedLocales(prev => {
            const newSet = new Set(prev);
            if (newSet.has(localeCode)) newSet.delete(localeCode);
            else newSet.add(localeCode);
            return newSet;
        });
    };

    const handleContentTypeToggle = (contentTypeId: string) => {
        setSelectedContentTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contentTypeId)) newSet.delete(contentTypeId);
            else newSet.add(contentTypeId);
            return newSet;
        });
    };

    const handleSelectAllLocales = (checked: boolean) => {
        if (checked) setSelectedLocales(new Set(backupData?.locales?.map((l: BackupLocale) => l.code) || []));
        else setSelectedLocales(new Set());
    };

    const handleSelectAllContentTypes = (checked: boolean) => {
        if (checked) setSelectedContentTypes(new Set(backupData?.contentTypes?.map((ct: BackupContentType) => ct.sys.id) || []));
        else setSelectedContentTypes(new Set());
    };

    const handleRestoreClick = () => {
        if (selectedLocales.size === 0 || selectedContentTypes.size === 0) return;
        setRestoreError(null);
        setOpenRestoreDialog(true);
    };

    const handleExecuteRestore = async () => {
        const spaceId = new URLSearchParams(window.location.search).get('spaceId');
        const targetEnv = new URLSearchParams(window.location.search).get('targetEnv') || 'master';

        if (!spaceId || !filename) return;

        dispatch({ type: "SET_DATA", payload: { selectedTarget: targetEnv } });
        setIsRestoring(true);
        setRestoreError(null);

        try {
            const backupObj: Backup = {
                id: (typeof filename === 'string' && !filename.startsWith('temp-preview-')) ? filename : undefined,
                name: typeof filename === 'string' ? filename : 'backup',
                time: Date.now(),
                path: ''
            };

            const options = {
                locales: Array.from(selectedLocales),
                contentTypes: Array.from(selectedContentTypes),
                clearEnvironment: clearEnvironment
            };

            await handleRestore(backupObj, options, backupData, targetEnv);
            setOpenRestoreDialog(false);
        } catch (error) {
            setRestoreError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsRestoring(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Decoding Archives...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <p className="text-sm font-bold text-destructive">{error}</p>
                <Button onClick={() => router.back()} variant="outline">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="gap-2 px-4 rounded-xl hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Back</span>
                    </Button>
                    <div className="h-8 w-[1px] bg-border/50" />
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                            Preview <span className="text-primary italic opacity-50">{filename}</span>
                        </h1>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Archive Contents Analysis</p>
                    </div>
                </div>
                {router.query.targetEnv && (
                    <Button
                        onClick={handleRestoreClick}
                        disabled={isRestoring || selectedLocales.size === 0 || selectedContentTypes.size === 0}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                        {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Execute Restore
                    </Button>
                )}
            </header>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/30 border border-border/50 p-1 rounded-xl w-full justify-start h-auto">
                    <TabsTrigger value="overview" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold uppercase tracking-wider text-sm">
                        <LayoutDashboard className="h-4 w-4" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="content" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold uppercase tracking-wider text-sm">
                        <FileText className="h-4 w-4" /> Content Browser
                    </TabsTrigger>
                    <TabsTrigger value="json" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold uppercase tracking-wider text-sm">
                        <Code className="h-4 w-4" /> Raw JSON
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-12 gap-6">
                        {[
                            { label: 'Content Types', value: stats?.contentTypes, icon: Layers, sub: `${selectedContentTypes.size} selected` },
                            { label: 'Entries', value: stats?.entries, icon: Database },
                            { label: 'Assets', value: stats?.assets, icon: ImageIcon },
                            { label: 'Locales', value: stats?.locales, icon: Globe, sub: `${selectedLocales.size} selected` }
                        ].map((stat, i) => (
                            <Card key={i} className="col-span-12 sm:col-span-6 md:col-span-3 bg-card border-border/50 shadow-xl">
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                                    <span className="text-4xl font-black tracking-tighter">{stat.value}</span>
                                    {stat.sub && <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full">{stat.sub}</span>}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {router.query.targetEnv && (
                        <Card className="bg-card border-border/50 shadow-xl">
                            <CardHeader className="py-4 px-6 border-b border-border/50 bg-muted/20">
                                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" /> Target Locales
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center space-x-2 pb-4 border-b border-border/50">
                                    <Checkbox
                                        id="select-all-locales"
                                        checked={backupData?.locales && backupData.locales.length > 0 && selectedLocales.size === backupData.locales.length}
                                        onCheckedChange={handleSelectAllLocales}
                                    />
                                    <label htmlFor="select-all-locales" className="text-xs font-bold uppercase tracking-widest cursor-pointer">
                                        Select All Locales
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {backupData?.locales?.map((locale: BackupLocale) => (
                                        <div key={locale.code} className="flex items-center space-x-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                                            <Checkbox
                                                id={`locale-${locale.code}`}
                                                checked={selectedLocales.has(locale.code)}
                                                onCheckedChange={() => handleLocaleToggle(locale.code)}
                                            />
                                            <label htmlFor={`locale-${locale.code}`} className="text-sm font-mono font-medium cursor-pointer flex-1">
                                                {locale.name} <span className="opacity-50">({locale.code})</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="content" className="h-[calc(100vh-300px)] min-h-[500px]">
                    <div className="grid grid-cols-12 gap-6 h-full">
                        {/* Sidebar */}
                        <Card className="col-span-12 md:col-span-3 bg-card/40 backdrop-blur-xl border-border/50 shadow-xl flex flex-col h-full overflow-hidden">
                            <div className="p-4 border-b border-border/50 space-y-4 bg-muted/30">
                                {router.query.targetEnv && (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                                        <Input
                                            placeholder="FILTER_TYPES..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 h-9 bg-muted/50 border-border/50 text-xs font-mono tracking-widest"
                                        />
                                    </div>
                                )}
                                {router.query.targetEnv && (
                                    <div className="flex items-center space-x-2 px-1">
                                        <Checkbox
                                            id="select-all-types"
                                            checked={backupData?.contentTypes && backupData.contentTypes.length > 0 && selectedContentTypes.size === backupData.contentTypes.length}
                                            onCheckedChange={handleSelectAllContentTypes}
                                        />
                                        <label htmlFor="select-all-types" className="text-xs font-black uppercase tracking-widest cursor-pointer text-muted-foreground">
                                            Select All Types
                                        </label>
                                    </div>
                                )}
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="flex flex-col p-2 gap-1">
                                    {filteredContentTypes.map((ct: BackupContentType) => (
                                        <button
                                            key={ct.sys.id}
                                            onClick={() => setSelectedContentType(ct.sys.id)}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg text-left transition-all gap-3",
                                                selectedContentType === ct.sys.id
                                                    ? "bg-primary/20 text-primary hover:bg-primary/25"
                                                    : "hover:bg-muted/10 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {router.query.targetEnv && (
                                                    <Checkbox
                                                        id={`type-${ct.sys.id}`}
                                                        checked={selectedContentTypes.has(ct.sys.id)}
                                                        onCheckedChange={() => handleContentTypeToggle(ct.sys.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    />
                                                )}
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-base font-bold truncate">{ct.name}</span>
                                                    <span className="text-xs font-mono opacity-50 truncate">{ct.sys.id}</span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] bg-muted/50 border-border/50 shrink-0">
                                                {entriesByContentType[ct.sys.id]?.length || 0}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </Card>

                        {/* Content Area */}
                        <Card className="col-span-12 md:col-span-9 bg-card border-border/50 shadow-xl flex flex-col h-full overflow-hidden">
                            <CardHeader className="py-4 px-6 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    {selectedContentType ? (
                                        <span>Entries: <span className="text-primary">{backupData?.contentTypes?.find((c: BackupContentType) => c.sys.id === selectedContentType)?.name}</span></span>
                                    ) : 'Select a Type'}
                                </CardTitle>
                                <span className="text-xs font-mono text-muted-foreground opacity-50">
                                    {filteredEntries.length} RECORDS FOUND
                                </span>
                            </CardHeader>
                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-4">
                                    {filteredEntries.map((entry: BackupEntry) => (
                                        <Accordion key={entry.sys.id} type="multiple" className="w-full">
                                            <AccordionItem value={entry.sys.id} className="border-0">
                                                <div className="rounded-xl border border-border/50 bg-muted/30 hover:border-border transition-colors overflow-hidden">
                                                    <AccordionTrigger className="px-4 py-4 hover:no-underline bg-muted/20 hover:bg-muted/40 transition-colors">
                                                        <div className="flex flex-1 items-center justify-between mr-4">
                                                            <div className="flex flex-col text-left">
                                                                <h4 className="text-base font-bold text-foreground">{getEntryTitle(entry, backupData?.contentTypes)}</h4>
                                                                <span className="text-xs font-mono text-muted-foreground opacity-50">ID: {entry.sys.id}</span>
                                                            </div>
                                                            <Badge variant="secondary" className="text-xs font-bold uppercase tracking-wider bg-muted/60 text-muted-foreground border-border/50 ml-4 shrink-0">
                                                                Published
                                                            </Badge>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-6 pb-6 pt-0">
                                                        <div className="space-y-6 pt-6 border-t border-border/50">
                                                            {Object.entries(entry.fields || {}).map(([fieldName, fieldContent]: [string, unknown]) => (
                                                                <div key={fieldName} className="grid grid-cols-12 gap-4 text-base">
                                                                    <div className="col-span-3 text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                                                                        {fieldName}
                                                                    </div>
                                                                    <div className="col-span-9">
                                                                        {/* Render field content for each locale */}
                                                                        {Object.entries(fieldContent as Record<string, unknown>).map(([locale, value]: [string, unknown]) => (
                                                                            <div key={locale} className="mb-2 last:mb-0">
                                                                                <span className="text-[11px] font-mono text-primary/50 block mb-1">{locale}</span>
                                                                                {value && typeof value === 'object' && (value as Record<string, unknown>).nodeType === 'document' ? (
                                                                                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
                                                                                        <RichTextRenderer node={value as RichTextNode} assets={backupData?.assets || []} entries={backupData?.entries || []} contentTypes={backupData?.contentTypes || []} />
                                                                                    </div>
                                                                                ) : value && typeof value === 'object' && (value as Record<string, unknown>).sys ? (() => {
                                                                                    const sys = (value as Record<string, unknown>).sys as Record<string, unknown>;
                                                                                    if (sys.type === 'Link' && sys.linkType === 'Asset') {
                                                                                        const assetId = sys.id as string;
                                                                                        const asset = backupData?.assets?.find((a: BackupAsset) => a.sys.id === assetId);
                                                                                        if (asset) {
                                                                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                                            const fileData = Object.values(asset.fields?.file || {})[0] as any;
                                                                                            const title = Object.values(asset.fields?.title || {})[0] as string || assetId;
                                                                                            if (fileData?.url && fileData.contentType?.startsWith('image/')) {
                                                                                                const imgUrl = fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url;
                                                                                                return (
                                                                                                    <div className="rounded-xl border border-border/50 bg-muted/30 overflow-hidden max-w-sm">
                                                                                                        <div className="relative w-full h-40 bg-muted/40">
                                                                                                            <Image
                                                                                                                src={imgUrl}
                                                                                                                alt={title}
                                                                                                                fill
                                                                                                                className="object-contain"
                                                                                                                unoptimized
                                                                                                            />
                                                                                                        </div>
                                                                                                        <div className="px-3 py-2 border-t border-border/50 flex items-center gap-2">
                                                                                                            <ImageIcon className="h-3 w-3 text-muted-foreground/50" />
                                                                                                            <span className="text-[10px] font-medium text-muted-foreground truncate">{title}</span>
                                                                                                            {fileData.details?.size && (
                                                                                                                <Badge variant="outline" className="text-[8px] ml-auto h-4 px-1.5 border-border/30">
                                                                                                                    {(fileData.details.size / 1024).toFixed(1)} KB
                                                                                                                </Badge>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            }
                                                                                            return (
                                                                                                <div className="p-2 rounded-lg bg-muted/30 text-xs flex items-center gap-2">
                                                                                                    <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                                                                    <span className="font-medium text-muted-foreground text-[10px]">{title}</span>
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                        return (
                                                                                            <div className="p-2 rounded-lg bg-muted/30 text-xs flex items-center gap-2 border border-dashed border-border/50">
                                                                                                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                                                                <span className="font-medium text-muted-foreground text-[10px]">Asset: <span className="font-mono opacity-70">{assetId}</span></span>
                                                                                                <Badge variant="outline" className="text-[9px] ml-auto border-dashed opacity-50 bg-muted/50">Attachment</Badge>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    if (sys.type === 'Link' && sys.linkType === 'Entry') {
                                                                                        const entryId = sys.id as string;
                                                                                        const linkedEntry = backupData?.entries?.find((e: BackupEntry) => e.sys.id === entryId);
                                                                                        const entryTitle = linkedEntry ? getEntryTitle(linkedEntry, backupData?.contentTypes) : entryId;
                                                                                        return (
                                                                                            <Badge variant="outline" className="text-[10px] gap-1.5 px-2.5 py-1 h-auto bg-muted/30 border-border/50">
                                                                                                <Layers className="h-3 w-3 text-primary/60" />
                                                                                                <span className="truncate max-w-[200px]">{entryTitle}</span>
                                                                                            </Badge>
                                                                                        );
                                                                                    }
                                                                                    return (
                                                                                        <div className="p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground font-mono break-all leading-relaxed">
                                                                                            {JSON.stringify(value, null, 2)}
                                                                                        </div>
                                                                                    );
                                                                                })() : Array.isArray(value) ? (() => {
                                                                                    const items = value as unknown[];
                                                                                    const hasLinks = items.some((item: unknown) =>
                                                                                        item && typeof item === 'object' &&
                                                                                        (item as Record<string, unknown>).sys &&
                                                                                        ((item as Record<string, unknown>).sys as Record<string, unknown>).type === 'Link'
                                                                                    );
                                                                                    if (hasLinks) {
                                                                                        return (
                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                {items.map((item: unknown, idx: number) => {
                                                                                                    const itemSys = (item as Record<string, unknown>).sys as Record<string, unknown> | undefined;
                                                                                                    if (itemSys?.linkType === 'Asset') {
                                                                                                        const assetId = itemSys.id as string;
                                                                                                        const asset = backupData?.assets?.find((a: BackupAsset) => a.sys.id === assetId);
                                                                                                        if (asset) {
                                                                                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                                                            const fileData = Object.values(asset.fields?.file || {})[0] as any;
                                                                                                            const title = Object.values(asset.fields?.title || {})[0] as string || assetId;
                                                                                                            if (fileData?.url && fileData.contentType?.startsWith('image/')) {
                                                                                                                const imgUrl = fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url;
                                                                                                                return (
                                                                                                                    <div key={idx} className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden w-32">
                                                                                                                        <div className="relative w-full h-24 bg-muted/40">
                                                                                                                            <Image src={imgUrl} alt={title} fill className="object-contain" unoptimized />
                                                                                                                        </div>
                                                                                                                        <div className="px-2 py-1 border-t border-border/50">
                                                                                                                            <span className="text-[9px] text-muted-foreground truncate block">{title}</span>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                );
                                                                                                            }
                                                                                                            return (
                                                                                                                <div key={idx} className="p-2 rounded-lg bg-muted/30 text-xs flex items-center gap-2">
                                                                                                                    <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                                                                                    <span className="font-medium text-muted-foreground text-[10px]">{title}</span>
                                                                                                                </div>
                                                                                                            );
                                                                                                        }
                                                                                                        return (
                                                                                                            <div key={idx} className="p-2 rounded-lg bg-muted/30 text-xs flex items-center gap-2 border border-dashed border-border/50">
                                                                                                                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                                                                                <span className="font-medium text-muted-foreground text-[10px]">Asset: <span className="font-mono opacity-70">{assetId}</span></span>
                                                                                                                <Badge variant="outline" className="text-[9px] ml-auto border-dashed opacity-50 bg-muted/50">Attachment</Badge>
                                                                                                            </div>
                                                                                                        );
                                                                                                    }
                                                                                                    if (itemSys?.linkType === 'Entry') {
                                                                                                        const entryId = itemSys.id as string;
                                                                                                        const linkedEntry = backupData?.entries?.find((e: BackupEntry) => e.sys.id === entryId);
                                                                                                        const entryTitle = linkedEntry ? getEntryTitle(linkedEntry, backupData?.contentTypes) : entryId;
                                                                                                        return (
                                                                                                            <Badge key={idx} variant="outline" className="text-[10px] gap-1.5 px-2.5 py-1 h-auto bg-muted/30 border-border/50">
                                                                                                                <Layers className="h-3 w-3 text-primary/60" />
                                                                                                                <span className="truncate max-w-[200px]">{entryTitle}</span>
                                                                                                            </Badge>
                                                                                                        );
                                                                                                    }
                                                                                                    return (
                                                                                                        <Badge key={idx} variant="outline" className="text-[10px]">
                                                                                                            {JSON.stringify(item)}
                                                                                                        </Badge>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    return (
                                                                                        <div className="p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground font-mono break-all leading-relaxed">
                                                                                            {JSON.stringify(value, null, 2)}
                                                                                        </div>
                                                                                    );
                                                                                })() : (
                                                                                    <div className="p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground font-mono break-all leading-relaxed">
                                                                                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </div>
                                            </AccordionItem>
                                        </Accordion>
                                    ))}
                                    {filteredEntries.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                            <Database className="h-12 w-12 text-muted-foreground mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No entries found for this type</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="json">
                    <Card className="bg-card border-border/50 shadow-xl">
                        <CardHeader className="py-4 px-6 border-b border-border/50 bg-muted/30">
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Code className="h-4 w-4 text-primary" /> JSON Structure
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="h-[600px]">
                            <pre className="p-6 font-mono text-[11px] leading-relaxed text-emerald-400 selection:bg-emerald-500/20">
                                {JSON.stringify(backupData, null, 2)}
                            </pre>
                        </ScrollArea>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={openRestoreDialog} onOpenChange={setOpenRestoreDialog}>
                <DialogContent className="sm:max-w-md bg-card border-border/50 rounded-3xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" /> Confirm Restore
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed pt-2">
                            You are about to restore <span className="text-foreground font-bold">{selectedContentTypes.size}</span> content types and related entries
                            across <span className="text-foreground font-bold">{selectedLocales.size}</span> locales.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 space-y-4">
                        <div className="flex items-top space-x-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                            <Checkbox
                                id="clear-env"
                                checked={clearEnvironment}
                                onCheckedChange={(checked) => setClearEnvironment(checked as boolean)}
                                className="mt-1 border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                            />
                            <div className="flex flex-col gap-1">
                                <label
                                    htmlFor="clear-env"
                                    className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-destructive cursor-pointer"
                                >
                                    Purge Environment First?
                                </label>
                                <p className="text-[10px] text-destructive/80 font-medium leading-relaxed">
                                    Warning: This will delete ALL existing content in the target environment before restoring.
                                </p>
                            </div>
                        </div>

                        {restoreError && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {restoreError}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-8 pt-4 sm:justify-between gap-3">
                        <Button variant="ghost" onClick={() => setOpenRestoreDialog(false)} className="text-xs font-black uppercase tracking-widest">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExecuteRestore}
                            disabled={isRestoring}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 px-8"
                        >
                            {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirm Action"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
