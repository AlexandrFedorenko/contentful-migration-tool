import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    ArrowLeft,
    Database,
    ShieldCheck,
    AlertTriangle,
    CloudDownload,
    Loader2,
    History,
    Info,
    HardDrive,
    Zap,
    FileArchive,
    CheckCircle2,
    Clock,
    ServerCrash
} from 'lucide-react';
import dynamic from 'next/dynamic';
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector';
import SpaceSelector from '@/components/SpaceSelector/SpaceSelector';
import { useGlobalContext } from '@/context/GlobalContext';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useBackups } from '@/hooks/useBackups';
import { useBackup } from '@/hooks/useBackup';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { PageHelp } from '@/components/PageHelp/PageHelp';
import { TabIndex } from '@/hooks/useDocumentationTabs';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BackupList = dynamic(() => import('@/components/BackupList/BackupList'), {
    loading: () => (
        <div className="flex items-center gap-2 p-8 text-muted-foreground justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading backup vault...</span>
        </div>
    ),
});

const JsonLogDisplay = dynamic(() => import('@/components/JsonLogDisplay/JsonLogDisplay'), {
    ssr: false,
});

const MigrationLogs = dynamic(() => import('@/components/MigrationLogs/MigrationLogs'), {
    ssr: false,
});
import { downloadAssetsClientSide, DownloadProgress } from '@/utils/client-asset-downloader';
import { toast } from 'sonner';

export default function BackupPage() {
    const router = useRouter();
    const { state, dispatch } = useGlobalContext();
    const { loadEnvironments } = useEnvironments();
    const { loadBackups } = useBackups();
    const { handleBackup } = useBackup();

    const [includeAssets, setIncludeAssets] = useState(false);
    const [includeDrafts, setIncludeDrafts] = useState(true);
    const [includeArchived, setIncludeArchived] = useState(true);
    const [assetWarningOpen, setAssetWarningOpen] = useState(false);
    const [backupMode, setBackupMode] = useState<'client' | 'server'>('client');
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

    // Overwrite Dialog State
    const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
    const [_existingBackupCount, setExistingBackupCount] = useState(0);
    const [maxBackupsAllowed, _setMaxBackupsAllowed] = useState(1);
    const [enableAssetBackups, setEnableAssetBackups] = useState(true);

    useNavigationGuard();

    useEffect(() => {
        // Fetch global settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setEnableAssetBackups(data.data.enableAssetBackups ?? true);
                }
            })
            .catch(err => console.error("Failed to load settings:", err));
    }, []);

    const handleAssetCheckboxChange = (checked: boolean) => {
        if (checked) {
            setAssetWarningOpen(true);
        } else {
            setIncludeAssets(false);
        }
    };

    const confirmAssetInclusion = () => {
        setIncludeAssets(true);
        setAssetWarningOpen(false);
    };

    const cancelAssetInclusion = () => {
        setIncludeAssets(false);
        setAssetWarningOpen(false);
    };

    const performBackup = async (overwrite: boolean) => {
        // If client-side asset download is selected, we tell the API NOT to include assets
        // because we will download them ourselves.
        const apiIncludeAssets = backupMode === 'server' ? includeAssets : false;

        const result = await handleBackup(apiIncludeAssets, includeDrafts, includeArchived, overwrite);

        if (result.limitReached) {
            setExistingBackupCount(state.backups?.length || 0);
            setOverwriteDialogOpen(true);
            return;
        }

        // Handle Client-Side Asset Download
        if (result.success && includeAssets && backupMode === 'client' && result.data?.backupId) {
            try {
                // 1. Fetch the full backup JSON
                setDownloadProgress({ total: 0, current: 0, stage: 'initializing' });

                const response = await fetch(`/api/download-backup?backupId=${result.data.backupId}`);
                if (!response.ok) throw new Error('Failed to fetch backup data for asset download');

                const backupData = await response.json();

                // 2. Start Client-Side Download
                await downloadAssetsClientSide(backupData, (progress) => {
                    setDownloadProgress(progress);
                });

                toast.success("Assets downloaded successfully!");
                setDownloadProgress(null);
            } catch (error) {
                console.error("Client-side download failed:", error);
                toast.error("Failed to download assets. Please try creating a server-side backup.");
                setDownloadProgress(null);
            }
        }
    };

    const handleInitialBackupClick = async () => {
        await performBackup(false);
    };

    const handleOverwriteConfirm = async () => {
        setOverwriteDialogOpen(false);
        await performBackup(true);
    };

    const handleDownloadExisting = () => {
        if (state.backups && state.backups.length > 0) {
            const isAssetBackupAttempt = backupMode === 'server' && includeAssets;
            let targetBackup;

            // Backups are sorted DESC (newest first). 
            // We want to download the one that will be deleted (the oldest relevant one).

            if (isAssetBackupAttempt) {
                // Return the oldest ZIP backup
                const zipBackups = state.backups.filter(b => b.hasZip);
                if (zipBackups.length > 0) {
                    targetBackup = zipBackups[zipBackups.length - 1];
                }
            }

            // Fallback: If not found (or not asset attempt), just take the absolute oldest
            if (!targetBackup) {
                targetBackup = state.backups[state.backups.length - 1];
            }

            // Determine correct download URL (ZIP vs JSON)
            let downloadUrl;
            if (targetBackup.hasZip) {
                downloadUrl = `/api/download-transient-zip?spaceId=${state.spaceId}&fileName=${encodeURIComponent(targetBackup.name)}`;
            } else {
                downloadUrl = `/api/download-backup?spaceId=${state.spaceId}&backupId=${targetBackup.id}&fileName=${encodeURIComponent(targetBackup.name)}`;
            }

            const link = document.createElement('a');
            link.href = downloadUrl;
            // If ZIP, let the browser/server handle the name, or force it
            link.download = targetBackup.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    useEffect(() => {
        if (state.spaceId) {
            loadEnvironments(state.spaceId);
            loadBackups(state.spaceId);
        }
    }, [state.spaceId, loadEnvironments, loadBackups]);

    const backupCount = state.backups?.length ?? 0;

    return (
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                        className="group border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Dashboard
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                Create Backup
                            </h1>
                            <PageHelp
                                description="Create a complete backup of an environment's content, content model, assets, and locales."
                                docTab={TabIndex.CREATE_BACKUP}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Snapshot your Contentful environment for safe keeping
                        </p>
                    </div>
                </div>
                {state.spaceId && (
                    <Badge
                        variant="outline"
                        className="text-xs font-semibold px-3 py-1.5 border-primary/20 bg-primary/5 text-primary gap-1.5 self-start"
                    >
                        <HardDrive className="h-3 w-3" />
                        {backupCount} backup{backupCount !== 1 ? 's' : ''} stored
                    </Badge>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Space + Info */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Space Selector Card */}
                    <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm shadow-lg dark:shadow-black/20 shadow-black/5">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
                        <CardHeader className="pb-4 relative">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center border border-primary/20">
                                    <Database className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold">Target Space</CardTitle>
                                    <CardDescription className="text-xs">Select the space to backup</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <SpaceSelector />
                        </CardContent>
                    </Card>

                    {/* Security Note Card */}
                    {state.spaceId && (
                        <Card className="relative overflow-hidden border-emerald-500/20 dark:border-emerald-500/15 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md">
                            <div className="absolute top-0 right-0 -mt-3 -mr-3 opacity-[0.04] dark:opacity-[0.06]">
                                <ShieldCheck className="h-28 w-28 text-emerald-500" />
                            </div>
                            <CardContent className="p-5 relative">
                                <div className="flex items-start gap-3.5">
                                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5">
                                        <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">Security Protocol</h3>
                                        <p className="text-xs text-emerald-800/70 dark:text-emerald-300/60 leading-relaxed">
                                            Backups are processed on-the-fly and stored temporarily.
                                            Metadata is permanently kept until deleted. Asset ZIPs are purged immediately after transmission.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Stats */}
                    {state.spaceId && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border/50 bg-card/60 dark:bg-card/40 p-4 text-center space-y-1.5 shadow-sm">
                                <Clock className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                                <p className="text-2xl font-extrabold text-foreground">{backupCount}</p>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Total Backups</p>
                            </div>
                            <div className="rounded-xl border border-border/50 bg-card/60 dark:bg-card/40 p-4 text-center space-y-1.5 shadow-sm">
                                <Zap className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                                <p className="text-2xl font-extrabold text-foreground">
                                    {state.donorEnvironments?.length ?? 0}
                                </p>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Environments</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Environment + Options + Action */}
                <div className="lg:col-span-7">
                    {state.spaceId ? (
                        <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm shadow-lg dark:shadow-black/20 shadow-black/5 h-full flex flex-col">
                            <div className="absolute inset-0 bg-gradient-to-bl from-primary/[0.02] to-transparent pointer-events-none" />
                            <CardHeader className="relative border-b border-border/50 bg-muted/30 dark:bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center border border-primary/20">
                                        <CloudDownload className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">Backup Configuration</CardTitle>
                                        <CardDescription className="text-xs">Choose environment and options</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 p-6 flex-grow relative">
                                {/* Environment Selector */}
                                <EnvironmentSelector
                                    environments={state.donorEnvironments}
                                    value={state.selectedDonor || ''}
                                    onChange={(env) => dispatch({ type: "SET_DATA", payload: { selectedDonor: env } })}
                                    label="Source Environment"
                                />

                                {/* Backup Options */}
                                <div className="space-y-4">
                                    <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-primary" />
                                        Backup Options
                                    </Label>

                                    <div className="space-y-3">
                                        {/* Draft Option */}
                                        <label
                                            htmlFor="include-drafts"
                                            className={cn(
                                                "flex items-center gap-5 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                                                includeDrafts
                                                    ? "border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-sm"
                                                    : "border-border/50 hover:border-border hover:bg-muted/30"
                                            )}
                                        >
                                            <Checkbox
                                                id="include-drafts"
                                                checked={includeDrafts}
                                                onCheckedChange={(checked) => setIncludeDrafts(!!checked)}
                                                className="shrink-0 scale-110"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-bold block mb-0.5">Include Draft Entities</span>
                                                <span className="text-xs text-muted-foreground block">Content created but not yet published</span>
                                            </div>
                                            {includeDrafts && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                                        </label>

                                        {/* Archived Option */}
                                        <label
                                            htmlFor="include-archived"
                                            className={cn(
                                                "flex items-center gap-5 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                                                includeArchived
                                                    ? "border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-sm"
                                                    : "border-border/50 hover:border-border hover:bg-muted/30"
                                            )}
                                        >
                                            <Checkbox
                                                id="include-archived"
                                                checked={includeArchived}
                                                onCheckedChange={(checked) => setIncludeArchived(!!checked)}
                                                className="shrink-0 scale-110"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-bold block mb-0.5">Include Archived Entities</span>
                                                <span className="text-xs text-muted-foreground block">Entities archived in Contentful</span>
                                            </div>
                                            {includeArchived && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                                        </label>

                                        {/* Assets Option */}
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="include-assets"
                                                className={cn(
                                                    "flex items-center gap-5 p-4 rounded-xl border transition-all duration-200",
                                                    !enableAssetBackups ? "opacity-60 cursor-not-allowed bg-muted/20" : "cursor-pointer",
                                                    includeAssets && enableAssetBackups
                                                        ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm"
                                                        : "border-border/50 hover:border-border hover:bg-muted/30"
                                                )}
                                            >
                                                <Checkbox
                                                    id="include-assets"
                                                    checked={includeAssets}
                                                    onCheckedChange={handleAssetCheckboxChange}
                                                    disabled={!enableAssetBackups}
                                                    className="shrink-0 scale-110"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-sm font-bold">Download Assets Archive</span>
                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5">
                                                            REC
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground block">Images and files into a separate ZIP</span>
                                                </div>
                                                {includeAssets
                                                    ? <FileArchive className="h-5 w-5 text-amber-500 shrink-0" />
                                                    : <FileArchive className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                                                }
                                            </label>

                                            {!enableAssetBackups && (
                                                <Alert className="py-2 px-3 bg-muted/40 border-dashed">
                                                    <Info className="h-3 w-3 text-muted-foreground" />
                                                    <AlertDescription className="text-[10px] text-muted-foreground ml-2">
                                                        Asset backups are currently disabled by administrator.
                                                        <br />
                                                        To migrate assets, use CLI:
                                                        <code className="bg-muted px-1 py-0.5 rounded text-[9px] ml-1 select-all">
                                                            contentful space export --space-id {state.spaceId} --download-assets
                                                        </code>
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>

                                        {/* Download Mode Selection (Only visible if assets are unchecked -> checked via logic below) */}
                                        {/* Reordered: Mode selection appears when assets are checked */}
                                        {includeAssets && (
                                            <div className="ml-8 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Download Mode</span>

                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className={cn(
                                                        "flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-all",
                                                        backupMode === 'client'
                                                            ? "bg-primary/10 border-primary/30"
                                                            : "bg-background border-border/50 hover:bg-muted"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            name="backupMode"
                                                            checked={backupMode === 'client'}
                                                            onChange={() => setBackupMode('client')}
                                                            className="h-4 w-4 text-primary"
                                                        />
                                                        <div>
                                                            <div className="text-sm font-semibold flex items-center gap-2">
                                                                Browser Download
                                                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-500/10 text-green-600 border-green-500/20">Recommended</Badge>
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                Saves assets directly to your computer. No server limit.
                                                            </div>
                                                        </div>
                                                    </label>

                                                    <label className={cn(
                                                        "flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-all",
                                                        backupMode === 'server'
                                                            ? "bg-amber-500/10 border-amber-500/30"
                                                            : "bg-background border-border/50 hover:bg-muted"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            name="backupMode"
                                                            checked={backupMode === 'server'}
                                                            onChange={() => setBackupMode('server')}
                                                            className="h-4 w-4 text-amber-500"
                                                        />
                                                        <div>
                                                            <div className="text-sm font-semibold text-foreground/80">Server Download</div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                Zips on server. Limited storage (1GB).
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>

                            {/* Action Footer */}
                            <CardFooter className="p-5 border-t border-border/50 bg-muted/20 dark:bg-muted/5 mt-auto">
                                <Button
                                    className={cn(
                                        "w-full h-13 text-sm font-bold tracking-wide shadow-lg transition-all duration-300",
                                        "bg-gradient-to-r from-primary via-primary to-indigo-600 hover:from-primary/90 hover:via-primary/90 hover:to-indigo-600/90",
                                        "shadow-primary/25 hover:shadow-primary/40 hover:shadow-xl",
                                        "disabled:opacity-50 disabled:shadow-none"
                                    )}
                                    disabled={!state.selectedDonor || state.loading.loadingBackup}
                                    onClick={handleInitialBackupClick}
                                >
                                    {state.loading.loadingBackup ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            PROCESSING BACKUP...
                                        </>
                                    ) : (
                                        <>
                                            <Database className="h-5 w-5 mr-2" />
                                            START ENVIRONMENT BACKUP
                                        </>
                                    )}
                                    {state.loading.loadingBackup && downloadProgress && (
                                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-xs font-medium z-10 rounded-md">
                                            <div className="w-48 space-y-2">
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>{downloadProgress.stage === 'zipping' ? 'Zipping...' : 'Downloading...'}</span>
                                                    <span>{Math.round((downloadProgress.current / downloadProgress.total) * 100)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-300 ease-out"
                                                        style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                                                    />
                                                </div>
                                                <div className="text-center text-[10px] text-muted-foreground truncate px-2">
                                                    {downloadProgress.fileName || 'Preparing...'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ) : (
                        <Card className="h-full border-dashed border-2 border-border/40 bg-card/30 dark:bg-card/10 shadow-none">
                            <CardContent className="flex flex-col items-center justify-center h-full p-12 text-center space-y-5 min-h-[350px]">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-150 animate-pulse" />
                                    <div className="relative h-16 w-16 rounded-2xl bg-muted/50 dark:bg-muted/30 flex items-center justify-center border border-border/50">
                                        <ServerCrash className="h-8 w-8 text-muted-foreground/40" />
                                    </div>
                                </div>
                                <div className="space-y-2 max-w-[280px]">
                                    <h3 className="text-lg font-bold text-foreground/70">No Space Selected</h3>
                                    <p className="text-sm text-muted-foreground/60 leading-relaxed">
                                        Choose a Contentful space from the left panel to begin backup configuration.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Backup History Section */}
            {
                state.spaceId && (
                    <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm shadow-lg dark:shadow-black/20 shadow-black/5">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.02] to-transparent pointer-events-none" />
                        <CardHeader className="relative border-b border-border/50 bg-muted/30 dark:bg-muted/10 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center border border-indigo-500/20">
                                        <History className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">Backup History</CardTitle>
                                        <CardDescription className="text-xs">View and manage your backup archive</CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] font-semibold px-2.5 py-1 border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                                >
                                    {backupCount} records
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <BackupList
                                selectedBackupForRestore={null}
                                onBackupSelect={() => { }}
                            />
                        </CardContent>
                    </Card>
                )
            }

            {/* Modals */}
            <JsonLogDisplay
                open={state.errorModalOpen}
                onClose={() => dispatch({ type: "TOGGLE_ERROR_MODAL", payload: false })}
                onMinimize={() => dispatch({ type: "TOGGLE_ERROR_MODAL", payload: false })}
                errorMessage={state.lastErrorMessage || undefined}
                backupFileName={state.errorBackupFile || undefined}
            />

            <MigrationLogs />

            {/* Asset Warning Dialog */}
            <Dialog open={assetWarningOpen} onOpenChange={(open) => !open && cancelAssetInclusion()}>
                <DialogContent className="max-w-md border-amber-500/20 bg-card/95 backdrop-blur-xl shadow-2xl shadow-amber-500/5">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                            </div>
                            <DialogTitle className="text-xl font-extrabold">
                                Asset Backup Protocol
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-foreground/70 leading-relaxed">
                            Including assets will create a full backup of all binary files. Please review our processing policy:
                        </DialogDescription>
                    </DialogHeader>

                    <Alert className="bg-amber-500/5 border-amber-500/20 my-2">
                        <Info className="h-4 w-4 text-amber-500" />
                        <AlertTitle className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                            Storage Notice
                        </AlertTitle>
                        <AlertDescription className="text-[11px] text-foreground/60">
                            Asset archives are significantly larger and managed with strict quotas.
                        </AlertDescription>
                    </Alert>

                    <ul className="space-y-2.5 py-2">
                        {[
                            "The ZIP archive will automatically download upon completion.",
                            "Server-side archive is purged immediately after download.",
                            "Strict limit of 1.0 GB applies. Larger operations will be aborted."
                        ].map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm text-foreground/70">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <DialogFooter className="pt-4 gap-3">
                        <Button variant="ghost" onClick={cancelAssetInclusion} className="font-semibold">
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmAssetInclusion}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20"
                        >
                            I Understand, Proceed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Overwrite Confirmation Dialog */}
            <Dialog open={overwriteDialogOpen} onOpenChange={setOverwriteDialogOpen}>
                <DialogContent className="max-w-md border-destructive/20 bg-card/95 backdrop-blur-xl shadow-2xl shadow-destructive/5">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
                                <Database className="h-5 w-5 text-destructive" />
                            </div>
                            <DialogTitle className="text-xl font-extrabold text-destructive">
                                Backup Limit Reached
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-foreground/70 leading-relaxed">
                            You have reached the limit of <strong>{maxBackupsAllowed} backup(s)</strong> per user.
                            Creating a new backup will <strong>permanently delete</strong> the existing one.
                        </DialogDescription>
                    </DialogHeader>

                    <Alert className="bg-destructive/5 border-destructive/10 my-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <AlertTitle className="text-xs font-bold uppercase tracking-widest text-destructive">
                            Warning: Irreversible Action
                        </AlertTitle>
                        <AlertDescription className="text-[11px] text-foreground/60">
                            The old backup cannot be restored once overwritten.
                        </AlertDescription>
                    </Alert>

                    <div className="flex flex-col gap-2 mt-2">
                        {state.backups && state.backups.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleDownloadExisting}
                                className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                            >
                                <CloudDownload className="h-4 w-4" />
                                Download existing backup first
                            </Button>
                        )}
                    </div>

                    <DialogFooter className="pt-4 gap-3">
                        <Button variant="ghost" onClick={() => setOverwriteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleOverwriteConfirm}
                            className="bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                        >
                            Overwrite & Create New
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
