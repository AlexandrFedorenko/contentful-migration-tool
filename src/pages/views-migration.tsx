/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Folder,
    RefreshCw,
    CheckCircle,
    ListFilter,
    Loader2,
    ChevronLeft,
    Database,
    Zap,
    Split
} from "lucide-react";
import { useGlobalContext } from '@/context/GlobalContext';
import { useSpaces } from '@/hooks/useSpaces';
import { useEnvironments } from '@/hooks/useEnvironments';
import { PageHelp } from '@/components/PageHelp/PageHelp';
import { TabIndex } from '@/hooks/useDocumentationTabs';
import { api } from '@/utils/api';
import { parseError, instructionToString } from '@/utils/errorParser';


interface ViewItem {
    id: string;
    title: string;
    displayedFieldIds?: string[];
}

interface ViewFolder {
    id: string;
    title: string;
    views: ViewItem[];
}

export default function ViewsMigration() {
    const router = useRouter();
    const { state, dispatch } = useGlobalContext();
    const { spaces } = useSpaces();
    const { loadEnvironments } = useEnvironments();

    const [sourceEnv, setSourceEnv] = useState('');
    const [targetEnv, setTargetEnv] = useState('');
    const [sourceFolders, setSourceFolders] = useState<ViewFolder[]>([]);
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (state.spaceId) {
            loadEnvironments(state.spaceId);
        }
    }, [state.spaceId, loadEnvironments]);

    const handleSpaceChange = (spaceId: string) => {
        dispatch({ type: "SET_SPACE_ID", payload: spaceId });
        loadEnvironments(spaceId);
        setSourceEnv('');
        setTargetEnv('');
        setSourceFolders([]);
        setSelectedFolders(new Set());
    };

    const handleScanViews = async () => {
        if (!state.spaceId || !sourceEnv) {
            setError('Please select space and source environment');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await api.post<any>('/api/get-views', {
                spaceId: state.spaceId,
                environmentId: sourceEnv
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to fetch views');
            }

            setSourceFolders(result.data.entryListViews || []);
        } catch (err) {
            const instruction = parseError(err instanceof Error ? err.message : 'Unknown error');
            const translatedError = instructionToString(instruction);
            setError(translatedError);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFolder = (folderId: string) => {
        const newSelected = new Set(selectedFolders);
        if (newSelected.has(folderId)) {
            newSelected.delete(folderId);
        } else {
            newSelected.add(folderId);
        }
        setSelectedFolders(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedFolders.size === sourceFolders.length) {
            setSelectedFolders(new Set());
        } else {
            setSelectedFolders(new Set(sourceFolders.map(f => f.id)));
        }
    };

    const handleMigrate = async () => {
        if (!state.spaceId || !sourceEnv || !targetEnv) {
            setError('Please select space, source and target environments');
            return;
        }

        if (selectedFolders.size === 0) {
            setError('Please select at least one folder to migrate');
            return;
        }

        if (sourceEnv === targetEnv) {
            setError('Source and target environments must be different');
            return;
        }

        setMigrating(true);
        setError('');
        setSuccess('');

        try {
            const result = await api.post<any>('/api/migrate-views', {
                spaceId: state.spaceId,
                sourceEnv,
                targetEnv,
                selectedViews: Array.from(selectedFolders)
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to migrate views');
            }

            setSuccess(`Successfully migrated ${result.data.migratedCount} view folders!`);
            setSelectedFolders(new Set());
        } catch (err) {
            const instruction = parseError(err instanceof Error ? err.message : 'Unknown error');
            const translatedError = instructionToString(instruction);
            setError(translatedError);
        } finally {
            setMigrating(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                        className="gap-2 px-4 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="text-base font-medium">Abort</span>
                    </Button>
                    <div className="h-8 w-[1px] bg-border/50" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-semibold text-foreground">
                                Views <span className="text-primary italic">Sync</span>
                            </h1>
                            <PageHelp
                                description="Migrate 'Saved Views' and folder structures between environments, which is not supported by the standard Contentful CLI."
                                docTab={TabIndex.VIEWS_MIGRATE}
                            />
                        </div>
                        <span className="text-base font-semibold ] text-muted-foreground">Organizational Mapping Protocol</span>
                    </div>
                </div>
            </div>

            {/* Selection Grid */}
            <Card className="border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden rounded-xl">
                <CardHeader className="py-4 px-8 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base font-medium">Node Node Selection</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-2">
                        <label className="text-base font-semibold text-muted-foreground px-1">Active Space Manifest</label>
                        <Select
                            value={state.spaceId || ''}
                            onValueChange={handleSpaceChange}
                        >
                            <SelectTrigger className="w-full bg-background/50 text-base h-11">
                                <SelectValue placeholder="Manifest Selection" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                                {spaces.map((space) => (
                                    <SelectItem key={space.id} value={space.id} className="text-base font-medium">
                                        {space.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-base font-semibold text-muted-foreground px-1">Source Node <span className="text-primary/50">(Donor)</span></label>
                            <Select
                                value={sourceEnv}
                                onValueChange={setSourceEnv}
                                disabled={!state.spaceId}
                            >
                                <SelectTrigger className="w-full bg-background/50 text-base h-11">
                                    <SelectValue placeholder="Origin Node" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                                    {state.donorEnvironments.map((env) => (
                                        <SelectItem
                                            key={env.id}
                                            value={env.id}
                                            disabled={env.id === targetEnv}
                                            className="text-base font-medium"
                                        >
                                            {env.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-base font-semibold text-muted-foreground px-1">Target Node <span className="text-primary/50">(Acceptor)</span></label>
                            <Select
                                value={targetEnv}
                                onValueChange={setTargetEnv}
                                disabled={!state.spaceId}
                            >
                                <SelectTrigger className="w-full bg-background/50 text-base h-11">
                                    <SelectValue placeholder="Destination Node" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                                    {state.donorEnvironments.map((env) => (
                                        <SelectItem
                                            key={env.id}
                                            value={env.id}
                                            disabled={env.id === sourceEnv}
                                            className="text-base font-medium"
                                        >
                                            {env.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleScanViews}
                        disabled={!state.spaceId || !sourceEnv || loading}
                        className="w-full h-12 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground font-bold gap-2 shadow-sm transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                        {loading ? 'Decrypting Folder Registry...' : 'Initialize Source Scan'}
                    </Button>
                </CardContent>
            </Card>

            {/* Notifications */}
            <div className="space-y-4">
                {error && (
                    <Alert variant="destructive" className="bg-rose-500/5 border-rose-500/20 text-rose-500 animate-in slide-in-from-top-2">
                        <Zap className="h-4 w-4" />
                        <AlertTitle className="text-base font-medium">Protocol Failure</AlertTitle>
                        <AlertDescription className="text-base font-medium italic">{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-emerald-500/5 border-emerald-500/20 text-emerald-500 animate-in slide-in-from-top-2">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle className="text-base font-medium">Sync Complete</AlertTitle>
                        <AlertDescription className="text-base font-medium italic">{success}</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Folder Manifest */}
            {sourceFolders.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-primary" />
                            <h3 className="text-base font-medium">Source Registry <span className="text-muted-foreground/60">({sourceFolders.length})</span></h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="text-base font-semibold hover:bg-muted/20"
                        >
                            {selectedFolders.size === sourceFolders.length ? 'Discard All' : 'Link All'}
                        </Button>
                    </div>

                    <div className="grid gap-3">
                        {sourceFolders.map((folder) => (
                            <Accordion key={folder.id} type="single" collapsible className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden group">
                                <AccordionItem value={folder.id} className="border-none">
                                    <div className="flex items-center px-6 py-4 hover:bg-muted/20 transition-all">
                                        <Checkbox
                                            checked={selectedFolders.has(folder.id)}
                                            onCheckedChange={() => handleToggleFolder(folder.id)}
                                            className="h-5 w-5 rounded-md border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                                        />
                                        <AccordionTrigger className="flex-1 hover:no-underline py-0 ml-4 group">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/10">
                                                    <Folder className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <h4 className="text-base font-semibold text-foreground/90">{folder.title || folder.id}</h4>
                                                    <p className="text-base font-semibold text-muted-foreground">{folder.views?.length || 0} payloads mirrored</p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                    </div>
                                    <AccordionContent className="px-16 pb-6 pt-2">
                                        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                                            {folder.views?.map((view) => (
                                                <div key={view.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-border transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <ListFilter className="h-3.5 w-3.5 text-muted-foreground/40" />
                                                        <div>
                                                            <div className="text-base font-bold text-foreground/80">{view.title || view.id}</div>
                                                            {view.displayedFieldIds && (
                                                                <div className="text-base font-semibold text-muted-foreground/40 mt-1 italic">
                                                                    Fields: {view.displayedFieldIds.slice(0, 3).join(', ')} {view.displayedFieldIds.length > 3 && '...'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-base font-semibold opacity-30 group-hover:opacity-100 transition-opacity">
                                                        ID: {view.id.slice(0, 8)}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {(!folder.views || folder.views.length === 0) && (
                                                <div className="text-base font-semibold text-muted-foreground leading-relaxed italic opacity-40 py-2">
                                                    * No views detected in folder registry
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        ))}
                    </div>

                    <div className="pt-6">
                        <Button
                            size="lg"
                            onClick={handleMigrate}
                            disabled={selectedFolders.size === 0 || !targetEnv || migrating}
                            className="w-full h-12 text-base font-bold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-[0.98]"
                        >
                            {migrating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Split className="h-6 w-6" />}
                            {migrating ? 'Mirroring Registry...' : `Commit selected Nodes (${selectedFolders.size})`}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
