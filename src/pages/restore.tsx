import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    Database,
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    CloudUpload,
    Loader2,
    History,
    Info,
    Upload,
    ChevronRight,
    ArrowLeft,
    FileJson
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector';
import BackupList from '@/components/BackupList/BackupList';
import SpaceSelector from '@/components/SpaceSelector/SpaceSelector';
import { useGlobalContext } from '@/context/GlobalContext';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useBackups } from '@/hooks/useBackups';
import { useRestore } from '@/hooks/useRestore';

import JsonLogDisplay from '@/components/JsonLogDisplay/JsonLogDisplay';
import MigrationLogs from '@/components/MigrationLogs/MigrationLogs';
import RestoreResultModal from '@/components/RestoreResultModal/RestoreResultModal';
import LocaleMappingModal from '@/components/LocaleMappingModal/LocaleMappingModal';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useAppSettings } from '@/hooks/useAppSettings';
import { PageHelp } from '@/components/PageHelp/PageHelp';
import { TabIndex } from '@/hooks/useDocumentationTabs';
import { Backup } from '@/types/backup';
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
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";



export default function RestorePage() {
    const router = useRouter();
    const { state, dispatch } = useGlobalContext();
    const { settings } = useAppSettings();
    const { loadEnvironments } = useEnvironments();
    const { loadBackups } = useBackups();
    const {
        handleRestore,
        mappingModalOpen,
        validationResult,
        confirmMapping,
        cancelMapping
    } = useRestore();



    useNavigationGuard();

    const maxMB = settings?.maxAssetSizeMB || 1024;
    const maxGB = (maxMB / 1024).toFixed(1);

    const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<Backup | null>(null);

    const [uploadMode, setUploadMode] = useState<"cloud" | "local-json" | "local-zip">("cloud");
    const [localBackupFile, setLocalBackupFile] = useState<File | null>(null);

    const [clearEnvironment, setClearEnvironment] = useState(false);
    const [includeAssets, setIncludeAssets] = useState(false);
    const [assetFile, setAssetFile] = useState<File | null>(null);
    const [assetWarningOpen, setAssetWarningOpen] = useState(false);

    const handleLocalBackupFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.json')) {
                alert('Please select a JSON backup file.');
                event.target.value = '';
                return;
            }
            setLocalBackupFile(file);
        }
    };

    const handleAssetCheckboxChange = (checked: boolean) => {
        if (checked) {
            setAssetWarningOpen(true);
        } else {
            setIncludeAssets(false);
            setAssetFile(null);
        }
    };

    const confirmAssetInclusion = () => {
        setIncludeAssets(true);
        setAssetWarningOpen(false);
    };

    const cancelAssetInclusion = () => {
        setIncludeAssets(false);
        setAssetWarningOpen(false);
        setAssetFile(null);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024 * 1024) {
                alert('File is too large. Maximum size is 1.0 GB.');
                event.target.value = '';
                return;
            }
            if (!file.name.endsWith('.zip')) {
                alert('Please select a ZIP file.');
                event.target.value = '';
                return;
            }
            setAssetFile(file);
        }
    };

    useEffect(() => {
        if (state.spaceId) {
            loadEnvironments(state.spaceId);
            loadBackups(state.spaceId);
        }
    }, [state.spaceId, loadEnvironments, loadBackups]);

    const [errorMinimized, setErrorMinimized] = useState(false);

    useEffect(() => {
        dispatch({ type: "SET_RESTORE_MODE", payload: true });
        return () => {
            dispatch({ type: "SET_RESTORE_MODE", payload: false });
            setErrorMinimized(false);
        };
    }, [dispatch]);

    return (
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="hover:bg-muted group"
                >
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Dashboard
                </Button>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">Restore Backup</h1>
                    <PageHelp
                        description="Restore content from a backup file to a target environment. WARNING: This process may overwrite existing data."
                        docTab={TabIndex.RESTORE_BACKUP}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Column 1: Select Space */}
                <div className="md:col-span-5 space-y-8">
                    <Card className="border-primary/20 bg-card/10 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Database className="h-4 w-4 text-primary" />
                                Target Space
                            </CardTitle>
                            <CardDescription>Select the Contentful space for restoration</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SpaceSelector />
                        </CardContent>
                    </Card>

                    {state.spaceId && (
                        <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
                            <CardHeader className="pb-4 border-b border-amber-500/10 mb-4 bg-amber-500/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-500">Destructive Action Warning</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                                <div>
                                    Restoring will overwrite content in the selected target environment.
                                    It is strongly recommended to backup the target environment first.
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Column 2: Target Environment & Action */}
                <div className="md:col-span-7">
                    {state.spaceId ? (
                        <Card className="border-primary/10 bg-card/10 backdrop-blur-sm h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <CloudUpload className="h-5 w-5 text-primary" />
                                    Target Environment
                                </CardTitle>
                                <CardDescription>Configure restoration parameters and environment cleanup</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 flex-grow">
                                <EnvironmentSelector
                                    environments={state.targetEnvironments}
                                    value={state.selectedTarget || ''}
                                    onChange={(env) => dispatch({ type: "SET_DATA", payload: { selectedTarget: env } })}
                                    label="Target Environment"
                                />

                                <Separator className="bg-border/50" />

                                <div className="space-y-4">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Restore Options</Label>

                                    <div className="space-y-4">
                                        <div className="flex items-start space-x-3 group p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                            <Checkbox
                                                id="clear-env"
                                                checked={clearEnvironment}
                                                onCheckedChange={(checked) => setClearEnvironment(!!checked)}
                                                className="mt-1 border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label htmlFor="clear-env" className="text-sm font-bold leading-none cursor-pointer text-amber-500">
                                                    Full Environment Purge
                                                </Label>
                                                <p className="text-xs text-muted-foreground italic">Delete all existing entries and assets before restoring the backup</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                                            <div className="flex items-start space-x-3 group">
                                                <Checkbox
                                                    id="include-assets"
                                                    checked={includeAssets}
                                                    onCheckedChange={handleAssetCheckboxChange}
                                                    className="mt-1"
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Label htmlFor="include-assets" className="text-sm font-bold leading-none cursor-pointer text-primary">
                                                        Include Asset Restoration
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground italic">
                                                        {uploadMode === "cloud" && selectedBackupForRestore?.hasZip
                                                            ? "Use cloud-stored ZIP archive for this backup"
                                                            : "Requires manual upload of a local asset ZIP archive"}
                                                    </p>
                                                </div>
                                            </div>

                                            {includeAssets && (
                                                <div className="ml-7 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {(uploadMode === "local-json" || uploadMode === "local-zip" || !selectedBackupForRestore?.hasZip || assetFile) ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                type="file"
                                                                accept=".zip"
                                                                onChange={handleFileChange}
                                                                className="hidden"
                                                                id="asset-zip-upload-side"
                                                            />
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full bg-background/50 border-border/50 group cursor-pointer"
                                                            >
                                                                <label htmlFor="asset-zip-upload-side">
                                                                    {assetFile ? (
                                                                        <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> {assetFile.name}</>
                                                                    ) : (
                                                                        <><Upload className="mr-2 h-4 w-4 group-hover:animate-bounce" /> SELECT ASSET ZIP</>
                                                                    )}
                                                                </label>
                                                            </Button>
                                                            {assetFile && (
                                                                <p className="text-[10px] text-green-500 font-bold px-1">
                                                                    FILE READY: {(assetFile.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-green-500">
                                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Cloud archive detected & synchronized</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/10 p-6 border-t mt-auto">
                                <Button
                                    className="w-full h-12 text-lg font-extrabold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90"
                                    disabled={
                                        !state.selectedTarget ||
                                        (uploadMode === "cloud" && !selectedBackupForRestore) ||
                                        (uploadMode === "local-json" && !localBackupFile) ||
                                        (uploadMode === "local-zip" && (!localBackupFile || !assetFile)) ||
                                        state.loading.loadingMigration ||
                                        state.restoreProgress.isActive
                                    }
                                    onClick={() => {
                                        if (uploadMode === "cloud" && selectedBackupForRestore) {
                                            handleRestore(selectedBackupForRestore, {
                                                clearEnvironment,
                                                includeAssets,
                                                assetFile: assetFile ?? undefined
                                            });
                                        } else if ((uploadMode === "local-json" || uploadMode === "local-zip") && localBackupFile) {
                                            handleRestore(null, {
                                                clearEnvironment,
                                                includeAssets: uploadMode === "local-zip" || includeAssets,
                                                assetFile: assetFile ?? undefined,
                                                backupFile: localBackupFile
                                            });
                                        }
                                    }}
                                >
                                    {state.loading.loadingMigration || state.restoreProgress.isActive ? (
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    ) : (
                                        <CloudUpload className="h-5 w-5 mr-2" />
                                    )}
                                    {state.loading.loadingMigration || state.restoreProgress.isActive
                                        ? "PROSESSING RESTORE..."
                                        : "EXECUTE RESTORATION"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ) : (
                        <div className="h-full border-2 border-dashed border-muted-foreground/10 rounded-xl flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <div className="p-4 bg-muted/50 rounded-full">
                                <Database className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <div className="max-w-[280px]">
                                <h3 className="text-lg font-bold text-muted-foreground/80">Restoration Logic Inactive</h3>
                                <p className="text-sm text-muted-foreground/60">Connect to a Contentful space to enable environment restoration capabilities.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Selection Section */}
            {state.spaceId && (
                <Tabs value={uploadMode} onValueChange={(val) => {
                    const mode = val as "cloud" | "local-json" | "local-zip";
                    setUploadMode(mode);
                    if (mode === "local-zip") {
                        setIncludeAssets(true);
                    }
                }} className="w-full mt-8">
                    <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-3 mb-8 bg-muted/50 p-1 border border-border/50 rounded-xl">
                        <TabsTrigger value="cloud" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-sm font-bold uppercase tracking-wider">
                            Cloud Vault
                        </TabsTrigger>
                        <TabsTrigger value="local-json" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-sm font-bold uppercase tracking-wider">
                            Local JSON
                        </TabsTrigger>
                        <TabsTrigger value="local-zip" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-sm font-bold uppercase tracking-wider">
                            Local JSON + ZIP
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cloud" className="mt-0">
                        <Card className="border-primary/10 overflow-hidden shadow-2xl min-h-[500px]">
                            <CardHeader className="bg-muted/20 border-b flex flex-row items-center justify-between py-4">
                                <div className="flex items-center gap-2">
                                    <History className="h-5 w-5 text-indigo-400" />
                                    <CardTitle className="text-xl">Available Backup Archives</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <BackupList
                                    selectedBackupForRestore={selectedBackupForRestore}
                                    onBackupSelect={setSelectedBackupForRestore}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="local-json" className="mt-0">
                        <Card className="border-primary/10 overflow-hidden shadow-2xl min-h-[300px]">
                            <CardHeader className="bg-muted/20 border-b flex flex-row items-center justify-between py-4">
                                <div className="flex items-center gap-2">
                                    <FileJson className="h-5 w-5 text-indigo-400" />
                                    <CardTitle className="text-xl">Upload Local Archive (JSON)</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-12 flex flex-col items-center justify-center space-y-6">
                                <div className="p-6 bg-primary/5 rounded-full border border-primary/10">
                                    <Upload className="h-12 w-12 text-primary" />
                                </div>
                                <div className="text-center space-y-2 max-w-sm">
                                    <h3 className="text-lg font-bold">Select JSON Backup File</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Upload a previously downloaded .json backup file directly from your computer.
                                    </p>
                                </div>

                                <div className="w-full max-w-md space-y-2">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleLocalBackupFileChange}
                                        className="hidden"
                                        id="local-backup-upload-json"
                                    />
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full h-14 border-primary/20 bg-background hover:bg-primary/5 hover:text-primary transition-all group cursor-pointer"
                                    >
                                        <label htmlFor="local-backup-upload-json" className="flex items-center justify-center gap-3">
                                            {localBackupFile ? (
                                                <><CheckCircle2 className="h-5 w-5 text-green-500" /> <span className="font-bold truncate max-w-[200px]">{localBackupFile.name}</span></>
                                            ) : (
                                                <><FileJson className="h-5 w-5 group-hover:scale-110 transition-transform" /> <span className="font-bold">BROWSE JSON FILE</span></>
                                            )}
                                        </label>
                                    </Button>
                                    {localBackupFile && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-green-500 font-bold tracking-wider mt-4">
                                            <span>FILE READY: {(localBackupFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="local-zip" className="mt-0">
                        <Card className="border-primary/10 overflow-hidden shadow-2xl min-h-[300px]">
                            <CardHeader className="bg-muted/20 border-b flex flex-row items-center justify-between py-4">
                                <div className="flex items-center gap-2">
                                    <FileJson className="h-5 w-5 text-indigo-400" />
                                    <CardTitle className="text-xl">Upload Local Archive + Assets (JSON & ZIP)</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-12 flex flex-col md:flex-row items-center justify-center gap-8">
                                <div className="flex-1 w-full max-w-sm space-y-6 flex flex-col items-center border p-6 rounded-xl bg-card/50">
                                    <div className="p-4 bg-primary/5 rounded-full border border-primary/10 mb-2">
                                        <FileJson className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <h3 className="text-base font-bold">1. JSON Backup</h3>
                                        <p className="text-xs text-muted-foreground">The structural representation.</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleLocalBackupFileChange}
                                        className="hidden"
                                        id="local-backup-upload-zip-json"
                                    />
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full h-12 border-primary/20 bg-background hover:bg-primary/5 hover:text-primary transition-all group cursor-pointer"
                                    >
                                        <label htmlFor="local-backup-upload-zip-json" className="flex items-center justify-center gap-2">
                                            {localBackupFile ? (
                                                <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="font-bold text-xs truncate max-w-[150px]">{localBackupFile.name}</span></>
                                            ) : (
                                                <><FileJson className="h-4 w-4" /> <span className="font-bold text-xs">SELECT JSON</span></>
                                            )}
                                        </label>
                                    </Button>
                                    {localBackupFile && (
                                        <span className="text-[10px] text-green-500 font-bold block mt-2 text-center">
                                            {(localBackupFile.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    )}
                                </div>

                                <div className="hidden md:block w-px h-32 bg-border"></div>

                                <div className="flex-1 w-full max-w-sm space-y-6 flex flex-col items-center border p-6 rounded-xl bg-card/50">
                                    <div className="p-4 bg-green-500/5 rounded-full border border-green-500/10 mb-2">
                                        <Upload className="h-8 w-8 text-green-500" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <h3 className="text-base font-bold">2. Assets ZIP</h3>
                                        <p className="text-xs text-muted-foreground">The media and static files.</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="local-backup-upload-zip-asset"
                                    />
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full h-12 border-green-500/20 bg-background hover:bg-green-500/5 hover:text-green-500 transition-all group cursor-pointer"
                                    >
                                        <label htmlFor="local-backup-upload-zip-asset" className="flex items-center justify-center gap-2">
                                            {assetFile ? (
                                                <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="font-bold text-xs truncate max-w-[150px]">{assetFile.name}</span></>
                                            ) : (
                                                <><Upload className="h-4 w-4" /> <span className="font-bold text-xs">SELECT ZIP</span></>
                                            )}
                                        </label>
                                    </Button>
                                    {assetFile && (
                                        <span className="text-[10px] text-green-500 font-bold block mt-2 text-center">
                                            {(assetFile.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                            {uploadMode === "local-zip" && (!assetFile || !localBackupFile) && (
                                <div className="p-4 bg-amber-500/10 text-center border-t border-amber-500/20">
                                    <p className="text-xs text-amber-500 font-bold">Both JSON and ZIP files are required to proceed.</p>
                                </div>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            <JsonLogDisplay
                open={state.errorModalOpen && !errorMinimized}
                onClose={() => dispatch({ type: "TOGGLE_ERROR_MODAL", payload: false })}
                onMinimize={() => setErrorMinimized(true)}
                errorMessage={state.lastErrorMessage || undefined}
                backupFileName={state.errorBackupFile || undefined}
            />

            {/* Minimized Error Notification */}
            {state.errorModalOpen && errorMinimized && (
                <div
                    className="fixed bottom-6 right-6 z-[2000] animate-in slide-in-from-right-10 duration-500"
                    onClick={() => setErrorMinimized(false)}
                >
                    <Alert variant="destructive" className="bg-destructive text-white border-none shadow-2xl cursor-pointer hover:bg-destructive/90 transition-colors py-3 pr-4 flex items-center gap-4">
                        <AlertCircle className="h-5 w-5" />
                        <div className="flex flex-col">
                            <AlertTitle className="text-xs font-bold uppercase tracking-widest m-0 leading-none">Restore Interrupted</AlertTitle>
                            <AlertDescription className="text-xs opacity-90">Issues detected. Click to expand log.</AlertDescription>
                        </div>
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Alert>
                </div>
            )}

            <MigrationLogs />

            <RestoreResultModal
                open={state.restoreResult?.open ?? false}
                onClose={() => dispatch({ type: "CLOSE_RESTORE_RESULT" })}
                success={state.restoreResult?.success ?? false}
                backupName={state.restoreResult?.backupName}
                targetEnvironment={state.restoreResult?.targetEnvironment}
                errorMessage={state.restoreResult?.errorMessage}
            />

            {validationResult && (
                <LocaleMappingModal
                    open={mappingModalOpen}
                    sourceLocales={validationResult.sourceLocales}
                    targetLocales={validationResult.targetLocales}
                    onConfirm={confirmMapping}
                    onCancel={cancelMapping}
                />
            )}

            {/* Asset Inclusion Warning Dialog */}
            <Dialog open={assetWarningOpen} onOpenChange={(open) => !open && cancelAssetInclusion()}>
                <DialogContent className="max-w-md border-primary/20 shadow-2xl shadow-primary/5">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary text-xl font-extrabold text-indigo-400">
                            <Upload className="h-6 w-6" /> Local Asset Deployment
                        </DialogTitle>
                        <DialogDescription className="text-foreground/80 pt-2 leading-relaxed">
                            You are about to upload a local ZIP archive to restore assets. Please ensure the archive follows the standardized format:
                        </DialogDescription>
                    </DialogHeader>

                    <Alert className="bg-primary/5 border-primary/10 my-4 py-2">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-xs font-bold uppercase tracking-widest text-primary">Upload Protocol</AlertTitle>
                        <AlertDescription className="text-[11px] leading-tight">
                            Files are processed in-memory and purged immediately after the operation concludes.
                        </AlertDescription>
                    </Alert>

                    <ul className="space-y-3 pt-2">
                        {[
                            "The ZIP archive must contain an `assets/` folder at its root level.",
                            "Strict limit of 1.0 GB applies. Larger files will be rejected by the server.",
                            "Maximum allowed for your plan: " + (maxMB < 1024 ? `${maxMB} MB` : `${maxGB} GB`)
                        ].map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm text-foreground/70">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <DialogFooter className="pt-6 gap-3">
                        <Button variant="ghost" onClick={cancelAssetInclusion}>CANCEL</Button>
                        <Button
                            onClick={confirmAssetInclusion}
                            className="bg-primary hover:bg-primary/90 text-white font-bold"
                        >
                            I UNDERSTAND, PROCEED
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
